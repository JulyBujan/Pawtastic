-- Migracion de estados de mascotas
-- Nuevo mapping: 1=Activa, 0=En revision, 2=Adoptada, 3=Archivada

START TRANSACTION;

-- 1) Adoptadas: si hay adopcion aprobada
UPDATE mascotas m
JOIN (
  SELECT DISTINCT id_mascota
  FROM adopciones
  WHERE estado = 1
) a ON a.id_mascota = m.id
SET m.estado = 2;

-- 2) Archivadas: mascotas en estado 2 sin adopcion aprobada
UPDATE mascotas m
LEFT JOIN (
  SELECT DISTINCT id_mascota
  FROM adopciones
  WHERE estado = 1
) a ON a.id_mascota = m.id
SET m.estado = 3
WHERE m.estado = 2 AND a.id_mascota IS NULL;

-- 3) En revision: pendientes sin aprobadas ni archivadas
UPDATE mascotas m
JOIN (
  SELECT DISTINCT id_mascota
  FROM adopciones
  WHERE estado = 0
) p ON p.id_mascota = m.id
LEFT JOIN (
  SELECT DISTINCT id_mascota
  FROM adopciones
  WHERE estado = 1
) a ON a.id_mascota = m.id
SET m.estado = 0
WHERE a.id_mascota IS NULL AND m.estado != 3;

-- 4) Activas: resto (sin aprobadas, sin pendientes y no archivadas)
UPDATE mascotas m
LEFT JOIN (
  SELECT DISTINCT id_mascota
  FROM adopciones
  WHERE estado = 1
) a ON a.id_mascota = m.id
LEFT JOIN (
  SELECT DISTINCT id_mascota
  FROM adopciones
  WHERE estado = 0
) p ON p.id_mascota = m.id
SET m.estado = 1
WHERE a.id_mascota IS NULL AND p.id_mascota IS NULL AND m.estado != 3;

COMMIT;
