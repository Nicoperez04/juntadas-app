-- ============================================================
-- Migración 009: Sistema de notificaciones
--
-- Agrega soporte para notificaciones in-app y push:
--   1. Columna push_token en profiles (para Expo Push Notifications)
--   2. Enum notification_type con los tipos definidos en la app
--   3. Tabla notifications con RLS de fila por usuario
--   4. Índice compuesto para consultas frecuentes (usuario + leídas)
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Columna push_token en profiles
--
-- Nullable y sin UNIQUE porque el mismo usuario puede registrar
-- múltiples dispositivos en el futuro. Por ahora se sobreescribe
-- con el último token registrado al iniciar la app.
-- ----------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN push_token TEXT;

-- ----------------------------------------------------------------
-- 2. Enum de tipos de notificación
--
-- joined         → alguien se unió a tu juntada (al organizador)
-- transferred    → te transfieren la organización (al nuevo org.)
-- review_enabled → juntada finalizada con reseñas habilitadas
-- reminder       → recordatorio 2 horas antes (local, no persistida)
-- ----------------------------------------------------------------
CREATE TYPE notification_type AS ENUM (
  'joined',
  'transferred',
  'review_enabled',
  'reminder'
);

-- ----------------------------------------------------------------
-- 3. Tabla notifications
--
-- Almacena el historial de notificaciones in-app de cada usuario.
-- Las notificaciones de tipo 'reminder' son locales en el dispositivo
-- y no se persisten aquí, pero el enum las incluye por consistencia.
-- ----------------------------------------------------------------
CREATE TABLE notifications (
  -- Identificador único de la notificación
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario destinatario; si se borra el perfil, se borran sus notificaciones
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Tipo de evento que generó la notificación
  type        notification_type NOT NULL,

  -- Título y cuerpo del mensaje tal como se muestra al usuario
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,

  -- Juntada relacionada; si la juntada se elimina, se desvincula sin borrar
  meetup_id   UUID REFERENCES meetups(id) ON DELETE SET NULL,

  -- false hasta que el usuario la vea o la marque explícitamente
  read        BOOLEAN NOT NULL DEFAULT false,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 4. Índice compuesto: mejora las queries de "notificaciones no
--    leídas del usuario X", que son las más frecuentes en la app.
-- ----------------------------------------------------------------
CREATE INDEX idx_notifications_user_read
  ON notifications (user_id, read);

-- ----------------------------------------------------------------
-- 5. RLS: cada usuario solo ve y opera sus propias notificaciones.
--    INSERT queda reservado exclusivamente al service role para que
--    solo la Edge Function (con privilegios de admin) pueda crear
--    notificaciones — evita que un cliente manipule notificaciones ajenas.
-- ----------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede leer sus notificaciones
CREATE POLICY "notifications_select_own"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Solo el propio usuario puede marcar como leída (UPDATE)
CREATE POLICY "notifications_update_own"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Solo el propio usuario puede borrar sus notificaciones
CREATE POLICY "notifications_delete_own"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT bloqueado para usuarios autenticados; solo service_role puede insertar.
-- Al no existir una política FOR INSERT para 'authenticated', RLS bloquea por defecto.
-- La Edge Function usa la service_role_key que bypasea RLS completamente.
