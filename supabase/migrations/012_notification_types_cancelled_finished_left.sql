-- ============================================================
-- Migración 012: Nuevos tipos de notificación
--
-- Extiende el enum notification_type con los eventos:
--   cancelled → juntada cancelada (participantes)
--   finished  → juntada finalizada (participantes)
--   left      → participante abandonó la juntada (organizador)
-- ============================================================

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'finished';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'left';
