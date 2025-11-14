-- SQL Inserts para nuevos usuarios, mascotas y adopciones de prueba
-- Generado para la base de datos 'tesis'

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- 1. Inserción de 5 nuevos usuarios
-- La contraseña para todos es 'password123' (hash SHA-256)
--

INSERT INTO `usuarios` (`id`, `email`, `password`, `tipo`, `ong_id`, `nombre`, `apellido`, `telefono`, `fecha_nacimiento`, `sexo`, `lat`, `lon`, `city`, `tipo_casa`, `otras_mascotas`, `experiencia`, `energia`, `sociabilidad`, `presencia`, `estilov`, `fecha_registro`, `estado`) VALUES
(17, 'carlos.gomez@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Carlos', 'Gomez', '3510000017', '1995-05-20', 'Masculino', -31.42, -64.18, 'Córdoba', 'Departamento', 0, 'Primeriza', 2, 3, 1, 1, DATE_SUB(CURDATE(), INTERVAL 80 DAY), 1),
(18, 'lucia.fernandez@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Lucía', 'Fernandez', '3510000018', '1988-11-10', 'Femenino', -31.39, -64.23, 'Córdoba', 'Casa con patio', 1, 'Avanzada', 3, 3, 3, 3, DATE_SUB(CURDATE(), INTERVAL 75 DAY), 1),
(19, 'martin.torres@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Martín', 'Torres', '3510000019', '2000-02-25', 'Masculino', -31.45, -64.15, 'Córdoba', 'Casa con patio', 0, 'Intermedia', 3, 2, 2, 2, DATE_SUB(CURDATE(), INTERVAL 60 DAY), 1),
(20, 'valentina.diaz@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Valentina', 'Diaz', '3510000020', '1992-09-30', 'Femenino', -31.41, -64.20, 'Córdoba', 'Departamento', 1, 'Intermedia', 1, 1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 55 DAY), 1),
(21, 'diego.ruiz@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Diego', 'Ruiz', '3510000021', '1985-07-12', 'Masculino', -31.37, -64.25, 'Córdoba', 'Casa con patio', 2, 'Avanzada', 2, 3, 2, 3, DATE_SUB(CURDATE(), INTERVAL 40 DAY), 1);

--
-- 2. Inserción de 10 nuevas mascotas para la ONG con id = 1
--

INSERT INTO `mascotas` (`id`, `id_ong`, `nombre`, `tipo`, `edad`, `sexo`, `tamaño`, `vacunado`, `esterilizado`, `chip`, `apto_ninos`, `apto_mascotas`, `descripcion`, `imagen`, `energia`, `sociabilidad`, `presencia`, `estilov`, `estado`, `date_publicacion`) VALUES
(61, 1, 'Rocky', 'perro', 24, 'Macho', 'Mediano', 'si', 'no', 'no', 1, 1, 'Un perro leal y enérgico, siempre listo para jugar a la pelota.', 'mascota_69137550caadb_perro8.jpg', 3, 3, 2, 2, 0, DATE_SUB(CURDATE(), INTERVAL 85 DAY)),
(62, 1, 'Misha', 'gato', 12, 'Hembra', 'Pequeño', 'si', 'si', 'no', 1, 1, 'Una gatita tranquila que ama las siestas al sol y los mimos suaves.', 'mascota_6913759fc8431_gato6.jpg', 1, 2, 1, 1, 0, DATE_SUB(CURDATE(), INTERVAL 82 DAY)),
(63, 1, 'Thor', 'perro', 48, 'Macho', 'Grande', 'si', 'si', 'si', 0, 0, 'Un grandulón con corazón de oro, prefiere ser la única mascota del hogar.', 'mascota_6902850151c60_rhodesian-perro-adulto.jpg', 2, 1, 3, 3, 0, DATE_SUB(CURDATE(), INTERVAL 78 DAY)),
(64, 1, 'Cleo', 'gato', 6, 'Hembra', 'Pequeño', 'no', 'no', 'no', 1, 1, 'Curiosa y juguetona, le encanta perseguir punteros láser.', 'mascota_6902836dea528_cat-persa-adulto-negro.jpg', 3, 3, 2, 1, 0, DATE_SUB(CURDATE(), INTERVAL 70 DAY)),
(65, 1, 'Buddy', 'perro', 30, 'Macho', 'Mediano', 'si', 'no', 'no', 1, 1, 'El compañero perfecto para caminatas, se lleva bien con todos.', 'mascota_6913748c2ed81_perro6.jpg', 2, 3, 2, 2, 0, DATE_SUB(CURDATE(), INTERVAL 65 DAY)),
(66, 1, 'Simba', 'gato', 18, 'Macho', 'Mediano', 'si', 'si', 'no', 1, 0, 'Un gato majestuoso y algo territorial. Ideal como mascota única.', 'mascota_6913757bc4b24_gato2.jpg', 2, 1, 1, 2, 0, DATE_SUB(CURDATE(), INTERVAL 58 DAY)),
(67, 1, 'Luna', 'perro', 8, 'Hembra', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Cachorra adorable y llena de vida, está aprendiendo a socializar.', 'mascota_69137453814e8_perro2.jpg', 3, 2, 3, 1, 0, DATE_SUB(CURDATE(), INTERVAL 50 DAY)),
(68, 1, 'Oliver', 'gato', 36, 'Macho', 'Mediano', 'si', 'si', 'si', 1, 1, 'Un gato muy inteligente y cariñoso que responde a su nombre.', 'mascota_6913764462cfc_gato3.jpg', 2, 2, 2, 1, 0, DATE_SUB(CURDATE(), INTERVAL 45 DAY)),
(69, 1, 'Daisy', 'perro', 60, 'Hembra', 'Grande', 'si', 'si', 'no', 1, 1, 'Una perra adulta muy tranquila y obediente, perfecta para una familia.', 'mascota_691375b8b589b_perro4.jpg', 1, 3, 1, 2, 0, DATE_SUB(CURDATE(), INTERVAL 35 DAY)),
(70, 1, 'Nala', 'gato', 20, 'Hembra', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Dulce y un poco tímida al principio, pero muy leal una vez que confía.', 'mascota_6913759fc8431_gato6.jpg', 1, 1, 2, 1, 0, DATE_SUB(CURDATE(), INTERVAL 30 DAY));

--
-- 3. Inserción de 7 nuevas adopciones (postulaciones)
-- Se asocian los nuevos usuarios (17-21) con las nuevas mascotas (61-70)
-- Estados: 0 (Pendiente), 1 (Aprobada)
--

INSERT INTO `adopciones` (`id_usuario`, `id_mascota`, `id_ong`, `comentarios`, `estado`, `fecha_inicio`) VALUES
-- Postulaciones en estado PENDIENTE (0)
(17, 61, 1, '[Usuario]: Estoy muy interesado en Rocky, parece el compañero ideal para mis salidas a correr.', 0, DATE_SUB(CURDATE(), INTERVAL 79 DAY)),
(19, 63, 1, '[Usuario]: Me gustaría saber más sobre el carácter de Thor y si es posible visitarlo.', 0, DATE_SUB(CURDATE(), INTERVAL 59 DAY)),
(20, 64, 1, '[Usuario]: Busco una gatita juguetona para mi departamento. Cleo parece perfecta.', 0, DATE_SUB(CURDATE(), INTERVAL 54 DAY)),
(21, 70, 1, '[Usuario]: Tengo experiencia con gatos tímidos y me encantaría darle un hogar a Nala.', 0, DATE_SUB(CURDATE(), INTERVAL 28 DAY)),

-- Postulaciones en estado APROBADA (1)
(18, 62, 1, '[Usuario]: Misha sería una gran compañía para mi otra mascota. Tenemos un patio grande.\n---\n[ONG]: Solicitud aprobada. Nos pondremos en contacto para coordinar la entrega.', 1, DATE_SUB(CURDATE(), INTERVAL 74 DAY)),
(17, 66, 1, '[Usuario]: Busco un gato independiente y Simba parece ideal.\n---\n[ONG]: Hemos revisado tu perfil y aprobamos la solicitud. ¡Felicidades!', 1, DATE_SUB(CURDATE(), INTERVAL 57 DAY)),
(19, 67, 1, '[Usuario]: ¡Qué cachorra tan bonita! Tenemos mucho amor y paciencia para darle.\n---\n[ONG]: ¡Luna ha encontrado un hogar! Solicitud aprobada.', 1, DATE_SUB(CURDATE(), INTERVAL 48 DAY));


--
-- Actualizar los AUTO_INCREMENT para evitar conflictos si se ejecuta varias veces
--

ALTER TABLE `usuarios` AUTO_INCREMENT = 22;
ALTER TABLE `mascotas` AUTO_INCREMENT = 71;
ALTER TABLE `adopciones` AUTO_INCREMENT = 48;

COMMIT;