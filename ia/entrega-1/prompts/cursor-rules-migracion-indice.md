# Cursor Rules, migración Supabase e índice IA

Creá la carpeta .cursor/rules/ en la raíz del repo (no dentro de mobile/) y dentro creá el archivo project.mdc con este contenido:
markdown# Bitácora de Juntadas — Cursor Rules

## Stack y tecnologías
- React Native + Expo SDK 55 + TypeScript
- Supabase (Auth + PostgreSQL + Storage)
- React Navigation (native-stack)
- TanStack Query para estado remoto
- Zustand para estado global
- React Hook Form + Zod para formularios
- expo-image-picker para fotos

## Arquitectura
- Estructura modular por features: `src/features/{auth,meetups,participants,impostor,memories}`
- Cada feature tiene: `screens/`, `services/`, `hooks/`, `schemas/`, `types.ts`
- Componentes reutilizables en `src/shared/components/`
- Cliente Supabase en `src/lib/supabase/client.ts`
- Variables de entorno en `src/config/env.ts`
- Constantes de negocio en `src/config/appConfig.ts`
- Navegación en `src/navigation/`
- Path alias `@/` apunta a `src/`

## Convenciones de código
- TypeScript estricto, sin `any`
- Componentes funcionales con arrow functions
- Props tipadas con interfaces, nunca type inline
- Nombres de componentes en PascalCase
- Nombres de archivos en PascalCase para componentes, camelCase para servicios y hooks
- Hooks personalizados con prefijo `use`
- Servicios con sufijo `Service` (ej: `authService`)
- Schemas de validación con sufijo `Schema` (ej: `loginSchema`)

## Supabase
- Siempre usar el cliente desde `@/lib/supabase/client`
- Nunca hacer queries directas en componentes o pantallas
- Toda lógica de Supabase va en los servicios de cada feature
- Manejar siempre los errores de Supabase explícitamente

## Navegación
- Usar siempre las constantes de `Routes` desde `@/navigation/routes`
- Nunca hardcodear nombres de rutas como strings
- Tipado de params de navegación en cada navigator

## Estilos y diseño
- Colores primarios: `#7C3AED` (violeta), `#EC4899` (rosa)
- Fondo general: `#F8F7FF`
- Texto principal: `#1A1A1A`, secundario: `#6B7280`
- Border radius generoso: 12-16px en cards y botones
- StyleSheet.create para todos los estilos, nunca inline styles complejos
- No usar librerías de UI externas salvo decisión explícita

## Restricciones estrictas
- No instalar dependencias nuevas sin decisión explícita
- No modificar `app.json`, `tsconfig.json` ni `package.json` sin avisar
- No tocar `src/lib/supabase/client.ts` ni `src/config/env.ts`
- No usar Expo Router ni carpeta `app/` como root
- No hacer commits
- No modificar archivos fuera del alcance indicado en cada prompt
- No crear estilos globales nuevos sin indicación
- Siempre reportar archivos modificados al finalizar

---

Creá el archivo supabase/migrations/001_initial_schema.sql y pegá todo el SQL que ejecutamos antes en Supabase. Lo tenés completo en este chat, es el bloque grande con los enums, las tablas, los triggers y las policies. Aca esta el comando: -- ============================================================
-- BITÁCORA DE JUNTADAS — Migración inicial
-- Entrega 1
-- ============================================================

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

CREATE TYPE meetup_status AS ENUM (
  'active',
  'cancelled',
  'finished'
);

CREATE TYPE participant_role AS ENUM (
  'organizer',
  'participant'
);

CREATE TYPE attendance_status AS ENUM (
  'pending',
  'confirmed',
  'declined'
);

CREATE TYPE game_status AS ENUM (
  'created',
  'active',
  'finished'
);

CREATE TYPE media_type AS ENUM (
  'photo'
);

-- ------------------------------------------------------------
-- TABLA: profiles
-- ------------------------------------------------------------

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsqueda por username
CREATE INDEX idx_profiles_username ON profiles(username);

-- ------------------------------------------------------------
-- TABLA: meetups
-- ------------------------------------------------------------

CREATE TABLE meetups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  date            DATE NOT NULL,
  time            TIME NOT NULL,
  location        TEXT NOT NULL,
  estimated_cost  NUMERIC(10, 2),
  status          meetup_status NOT NULL DEFAULT 'active',
  join_code       TEXT UNIQUE NOT NULL,
  created_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at    TIMESTAMPTZ
);

-- Índices para queries frecuentes
CREATE INDEX idx_meetups_created_by ON meetups(created_by);
CREATE INDEX idx_meetups_join_code  ON meetups(join_code);
CREATE INDEX idx_meetups_status     ON meetups(status);

-- ------------------------------------------------------------
-- TABLA: meetup_participants
-- ------------------------------------------------------------

CREATE TABLE meetup_participants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id         UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role              participant_role NOT NULL DEFAULT 'participant',
  attendance_status attendance_status NOT NULL DEFAULT 'pending',
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at           TIMESTAMPTZ,

  -- Un usuario no puede estar dos veces en la misma juntada
  CONSTRAINT uq_meetup_participant UNIQUE (meetup_id, user_id)
);

-- Índices para queries frecuentes
CREATE INDEX idx_meetup_participants_meetup_id ON meetup_participants(meetup_id);
CREATE INDEX idx_meetup_participants_user_id   ON meetup_participants(user_id);

-- ------------------------------------------------------------
-- TABLA: impostor_games
-- ------------------------------------------------------------

CREATE TABLE impostor_games (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id        UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic            TEXT NOT NULL,
  normal_prompt    TEXT NOT NULL,
  impostor_prompt  TEXT NOT NULL,
  impostor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status           game_status NOT NULL DEFAULT 'created',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at       TIMESTAMPTZ,
  finished_at      TIMESTAMPTZ
);

-- Índice para buscar partidas de una juntada
CREATE INDEX idx_impostor_games_meetup_id ON impostor_games(meetup_id);

-- ------------------------------------------------------------
-- TABLA: memories
-- ------------------------------------------------------------

CREATE TABLE memories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id    UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  uploaded_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url     TEXT NOT NULL,
  file_path    TEXT NOT NULL,
  caption      TEXT,
  media_type   media_type NOT NULL DEFAULT 'photo',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para buscar recuerdos de una juntada
CREATE INDEX idx_memories_meetup_id ON memories(meetup_id);

-- ------------------------------------------------------------
-- TRIGGER: crear perfil automáticamente al registrarse
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::TEXT, 8))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ------------------------------------------------------------
-- TRIGGER: actualizar updated_at automáticamente
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_meetups_updated_at
  BEFORE UPDATE ON meetups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_meetup_participants_updated_at
  BEFORE UPDATE ON meetup_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE impostor_games     ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories           ENABLE ROW LEVEL SECURITY;

-- profiles: cada usuario ve y edita solo su propio perfil
CREATE POLICY "profiles: select own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- meetups: un usuario ve las juntadas donde participa o es organizador
CREATE POLICY "meetups: select as participant or organizer"
  ON meetups FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM meetup_participants
      WHERE meetup_id = meetups.id
      AND user_id = auth.uid()
      AND left_at IS NULL
    )
  );

CREATE POLICY "meetups: insert own"
  ON meetups FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "meetups: update own"
  ON meetups FOR UPDATE
  USING (created_by = auth.uid());

-- meetup_participants: ver participantes de juntadas donde participás
CREATE POLICY "meetup_participants: select"
  ON meetup_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetup_participants mp
      WHERE mp.meetup_id = meetup_participants.meetup_id
      AND mp.user_id = auth.uid()
      AND mp.left_at IS NULL
    )
  );

CREATE POLICY "meetup_participants: insert own"
  ON meetup_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meetup_participants: update own"
  ON meetup_participants FOR UPDATE
  USING (user_id = auth.uid());

-- impostor_games: ver partidas de juntadas donde participás
CREATE POLICY "impostor_games: select"
  ON impostor_games FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetup_participants
      WHERE meetup_id = impostor_games.meetup_id
      AND user_id = auth.uid()
      AND left_at IS NULL
    )
  );

CREATE POLICY "impostor_games: insert"
  ON impostor_games FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- memories: ver recuerdos de juntadas donde participás
CREATE POLICY "memories: select"
  ON memories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetup_participants
      WHERE meetup_id = memories.meetup_id
      AND user_id = auth.uid()
      AND left_at IS NULL
    )
  );

CREATE POLICY "memories: insert"
  ON memories FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "memories: delete own"
  ON memories FOR DELETE
  USING (uploaded_by = auth.uid());

---

Paso 3 — Actualizar el índice de IA.
Abrí ia/entrega-1/indice_ia.md y reemplazá el contenido con esto:
markdown# Índice de temas consultados con IA — Entrega 1

## Claude (claude.ai)

01 - Contextualización del proyecto y revisión de documentos técnicos
02 - Análisis y revisión del diseño en Figma (mockups y wireframes)
03 - Planificación general del flujo de trabajo y fases de desarrollo
04 - Estructura del repositorio GitHub y convenciones de commits
05 - Inicialización del proyecto Expo con template blank-typescript
06 - Instalación y alineación de dependencias SDK 55
07 - Análisis y diseño del modelo de datos en Supabase
08 - Creación de tablas, enums, triggers, índices y políticas RLS
09 - Configuración del cliente de Supabase y variables de entorno
10 - Esqueleto de navegación con React Navigation
11 - Resolución de conflicto entre Expo Router y React Navigation
12 - Configuración de Cursor Rules para el proyecto

## Cursor

01 - Generación de estructura inicial de carpetas del proyecto
02 - Diagnóstico y resolución del conflicto Expo Router / src/app
03 - Renombrado de src/app a src/navigation

---
