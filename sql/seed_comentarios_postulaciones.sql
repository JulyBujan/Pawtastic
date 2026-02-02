-- Popular comentarios para postulaciones aprobadas y rechazadas
-- Solo completa si comentarios está vacío o NULL.

START TRANSACTION;

UPDATE adopciones
SET comentarios = CONCAT('[', DATE_FORMAT(NOW(), '%d/%m/%Y %H:%i'), ' - ONG]: ',
  'Postulación aprobada. Nos contactaremos para coordinar los próximos pasos.')
WHERE estado = 1
  AND (comentarios IS NULL OR TRIM(comentarios) = '');

UPDATE adopciones
SET comentarios = CONCAT('[', DATE_FORMAT(NOW(), '%d/%m/%Y %H:%i'), ' - ONG]: ',
  'Postulación rechazada. Gracias por postularte.')
WHERE estado = 2
  AND (comentarios IS NULL OR TRIM(comentarios) = '');

COMMIT;
