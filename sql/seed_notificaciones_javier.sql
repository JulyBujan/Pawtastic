-- Seed: notificaciones de prueba para javier@ong1.org
START TRANSACTION;

USE pawtastic;

SET @javier_id := (SELECT id FROM usuarios WHERE email = 'javier@ong1.org');
SET @javier_ong_id := (SELECT ong_id FROM usuarios WHERE email = 'javier@ong1.org');
SET @actor_id := (SELECT id FROM usuarios WHERE email = 'sbujan@gmail.com');
SET @adopcion_id := (
  SELECT id
  FROM adopciones
  WHERE id_ong = @javier_ong_id
  ORDER BY fecha_inicio DESC, id DESC
  LIMIT 1
);
SET @mascota_id := (SELECT id_mascota FROM adopciones WHERE id = @adopcion_id);

INSERT INTO adopcion_eventos (
  adopcion_id,
  actor_id,
  tipo,
  estado_nuevo,
  detalle,
  metadata
)
SELECT
  @adopcion_id,
  @actor_id,
  'postulacion_creada',
  0,
  'Nueva postulacion generada para pruebas.',
  JSON_OBJECT('seed', true)
WHERE @adopcion_id IS NOT NULL AND @actor_id IS NOT NULL;

INSERT INTO adopcion_eventos (
  adopcion_id,
  actor_id,
  tipo,
  detalle,
  metadata
)
SELECT
  @adopcion_id,
  @actor_id,
  'comentario_agregado',
  'Comentario de prueba para la ONG.',
  JSON_OBJECT('seed', true, 'comentario', 'Comentario de prueba para la ONG.')
WHERE @adopcion_id IS NOT NULL AND @actor_id IS NOT NULL;

INSERT INTO adopcion_eventos (
  adopcion_id,
  actor_id,
  tipo,
  estado_anterior,
  estado_nuevo,
  detalle,
  metadata
)
SELECT
  @adopcion_id,
  @actor_id,
  'estado_actualizado',
  0,
  1,
  'Estado actualizado a Aprobada (prueba).',
  JSON_OBJECT('seed', true, 'estado_anterior', 0, 'estado_nuevo', 1)
WHERE @adopcion_id IS NOT NULL AND @actor_id IS NOT NULL;

INSERT INTO notificaciones (
  usuario_id,
  actor_id,
  tipo,
  titulo,
  cuerpo,
  entidad_tipo,
  entidad_id,
  leida_at,
  created_at,
  payload
)
SELECT
  @javier_id,
  @actor_id,
  'postulacion_creada',
  'Nueva postulacion',
  'Nueva postulacion para una mascota.',
  'adopcion',
  @adopcion_id,
  NULL,
  NOW() - INTERVAL 2 HOUR,
  JSON_OBJECT('adopcion_id', @adopcion_id, 'mascota_id', @mascota_id)
WHERE @javier_id IS NOT NULL;

INSERT INTO notificaciones (
  usuario_id,
  actor_id,
  tipo,
  titulo,
  cuerpo,
  entidad_tipo,
  entidad_id,
  leida_at,
  created_at,
  payload
)
SELECT
  @javier_id,
  @actor_id,
  'comentario_agregado',
  'Nuevo comentario',
  'Se agrego un comentario en una postulacion.',
  'adopcion',
  @adopcion_id,
  NULL,
  NOW() - INTERVAL 45 MINUTE,
  JSON_OBJECT('adopcion_id', @adopcion_id, 'mascota_id', @mascota_id)
WHERE @javier_id IS NOT NULL;

INSERT INTO notificaciones (
  usuario_id,
  actor_id,
  tipo,
  titulo,
  cuerpo,
  entidad_tipo,
  entidad_id,
  leida_at,
  created_at,
  payload
)
SELECT
  @javier_id,
  @actor_id,
  'estado_actualizado',
  'Estado actualizado',
  'Una postulacion fue aprobada (prueba).',
  'adopcion',
  @adopcion_id,
  NOW() - INTERVAL 10 MINUTE,
  NOW() - INTERVAL 20 MINUTE,
  JSON_OBJECT('adopcion_id', @adopcion_id, 'mascota_id', @mascota_id, 'estado_nuevo', 1)
WHERE @javier_id IS NOT NULL;

COMMIT;
