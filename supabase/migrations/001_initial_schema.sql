-- ============================================================
-- JUNTADAS — Migración inicial
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
