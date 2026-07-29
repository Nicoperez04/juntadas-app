-- Migración 029: Agregar coordenadas GPS a la tabla meetups
--
-- Añade las columnas latitude y longitude para almacenar la ubicación
-- exacta de una juntada seleccionada por el organizador mediante el
-- componente LocationPicker (RF-40).
--
-- Ambas columnas son opcionales (DEFAULT NULL): las juntadas existentes
-- y las nuevas creadas sin selección de mapa mantienen el valor NULL
-- sin ningún impacto en la lógica de negocio preexistente.
--
-- Tipo DOUBLE PRECISION (IEEE 754 64-bit) es el estándar para coordenadas
-- geográficas en PostgreSQL: soporta la precisión requerida por GPS
-- (~1.1 cm en el ecuador con 7 decimales significativos).

ALTER TABLE meetups
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT NULL;

-- Comentarios descriptivos en el catálogo de Postgres
COMMENT ON COLUMN meetups.latitude  IS 'Latitud GPS de la ubicación de la juntada; null si el organizador no la definió.';
COMMENT ON COLUMN meetups.longitude IS 'Longitud GPS de la ubicación de la juntada; null si el organizador no la definió.';
