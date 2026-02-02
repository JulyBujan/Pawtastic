-- Corrige postulaciones aprobadas duplicadas por mascota.
-- Mantiene la aprobada más reciente (fecha_fin o fecha_inicio) y,
-- en empate, la de mayor id. El resto queda en Rechazada.

START TRANSACTION;

CREATE TEMPORARY TABLE tmp_max_fecha AS
SELECT id_mascota,
       MAX(COALESCE(fecha_fin, fecha_inicio)) AS max_fecha
FROM adopciones
WHERE estado = 1
GROUP BY id_mascota;

CREATE TEMPORARY TABLE tmp_max_fecha2 AS
SELECT * FROM tmp_max_fecha;

CREATE TEMPORARY TABLE tmp_keep AS
SELECT a.id
FROM adopciones a
JOIN tmp_max_fecha t
  ON t.id_mascota = a.id_mascota
 AND COALESCE(a.fecha_fin, a.fecha_inicio) = t.max_fecha
JOIN (
  SELECT a2.id_mascota, MAX(a2.id) AS max_id
  FROM adopciones a2
  JOIN tmp_max_fecha2 t2
    ON t2.id_mascota = a2.id_mascota
   AND COALESCE(a2.fecha_fin, a2.fecha_inicio) = t2.max_fecha
  WHERE a2.estado = 1
  GROUP BY a2.id_mascota
) k ON k.id_mascota = a.id_mascota AND k.max_id = a.id
WHERE a.estado = 1;

UPDATE adopciones
SET estado = 2,
    fecha_fin = COALESCE(fecha_fin, NOW())
WHERE estado = 1
  AND id NOT IN (SELECT id FROM tmp_keep);

DROP TEMPORARY TABLE IF EXISTS tmp_keep;
DROP TEMPORARY TABLE IF EXISTS tmp_max_fecha2;
DROP TEMPORARY TABLE IF EXISTS tmp_max_fecha;

-- Re-sincroniza el estado de mascotas (sin tocar archivadas).
UPDATE mascotas m
JOIN (
  SELECT DISTINCT id_mascota
  FROM adopciones
  WHERE estado = 1
) a ON a.id_mascota = m.id
SET m.estado = 2
WHERE m.estado != 3;

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
