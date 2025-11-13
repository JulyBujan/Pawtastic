-- ####################################################################
-- ## INSERTS PARA 20 NUEVAS MASCOTAS PARA LA ONG CON ID = 1         ##
-- ####################################################################

-- Asumimos que los IDs de las nuevas mascotas irán del 41 al 60.

INSERT INTO `mascotas` (`id`, `id_ong`, `nombre`, `tipo`, `edad`, `sexo`, `tamaño`, `vacunado`, `esterilizado`, `chip`, `descripcion`, `imagen`, `energia`, `sociabilidad`, `presencia`, `estilov`, `estado`, `date_publicacion`) VALUES
(41, 1, 'Rocky', 'perro', 2, 'Macho', 'Mediano', 'si', 'si', 'no', 'Un perro leal y enérgico, siempre listo para una aventura.', NULL, 3, 3, 2, 3, 0, '2025-08-15 10:00:00'),
(42, 1, 'Mila', 'gato', 1, 'Hembra', 'Pequeño', 'si', 'si', 'no', 'Una gatita curiosa y juguetona que adora las siestas al sol.', NULL, 2, 2, 1, 1, 0, '2025-08-20 11:30:00'),
(43, 1, 'Thor', 'perro', 5, 'Macho', 'Grande', 'si', 'si', 'si', 'Un gigante noble y tranquilo. Perfecto para una familia con espacio.', NULL, 1, 3, 3, 2, 0, '2025-09-01 14:00:00'),
(44, 1, 'Luna', 'gato', 3, 'Hembra', 'Mediano', 'si', 'si', 'no', 'Elegante y un poco tímida al principio, pero muy cariñosa.', NULL, 1, 1, 2, 1, 0, '2025-09-05 09:00:00'),
(45, 1, 'Coco', 'perro', 1, 'Macho', 'Pequeño', 'si', 'no', 'no', 'Cachorro lleno de energía y travesuras. Necesita entrenamiento y paciencia.', NULL, 3, 2, 1, 3, 0, '2025-09-10 16:45:00'),
(46, 1, 'Nina', 'gato', 6, 'Hembra', 'Pequeño', 'si', 'si', 'si', 'Una dama tranquila que solo busca un regazo cálido y mimos.', NULL, 1, 2, 3, 1, 0, '2025-09-12 18:00:00'),
(47, 1, 'Leo', 'perro', 4, 'Macho', 'Mediano', 'si', 'si', 'no', 'Inteligente y obediente, aprende trucos con facilidad.', NULL, 2, 3, 2, 2, 0, '2025-09-18 12:00:00'),
(48, 1, 'Simba', 'gato', 2, 'Macho', 'Grande', 'si', 'si', 'no', 'Un gato majestuoso con espíritu de líder. Le gusta explorar.', NULL, 3, 2, 2, 3, 0, '2025-09-20 13:10:00'),
(49, 1, 'Lola', 'perro', 7, 'Hembra', 'Pequeño', 'si', 'si', 'si', 'Una perrita senior muy dulce, ideal para compañía tranquila.', NULL, 1, 3, 3, 1, 0, '2025-09-25 11:00:00'),
(50, 1, 'Oliver', 'gato', 1, 'Macho', 'Pequeño', 'si', 'no', 'no', 'Un gatito aventurero y muy sociable, se lleva bien con todos.', NULL, 3, 3, 1, 2, 0, '2025-09-28 15:00:00'),
(51, 1, 'Max', 'perro', 3, 'Macho', 'Grande', 'si', 'si', 'no', 'Guardián por naturaleza, pero un osito de peluche con su familia.', NULL, 2, 2, 3, 3, 0, '2025-08-16 10:00:00'),
(52, 1, 'Cleo', 'gato', 5, 'Hembra', 'Mediano', 'si', 'si', 'si', 'Una gata independiente que sabe lo que quiere. Reina de la casa.', NULL, 1, 1, 2, 1, 0, '2025-08-17 14:20:00'),
(53, 1, 'Bruno', 'perro', 6, 'Macho', 'Mediano', 'si', 'si', 'no', 'Compañero fiel para largas caminatas. Se porta excelente con correa.', NULL, 2, 3, 2, 2, 0, '2025-08-18 17:00:00'),
(54, 1, 'Zoe', 'gato', 2, 'Hembra', 'Pequeño', 'si', 'si', 'no', 'Juguetona y muy vocal. Le encanta "conversar" con sus humanos.', NULL, 3, 2, 1, 2, 0, '2025-08-14 09:30:00'),
(55, 1, 'Toby', 'perro', 1, 'Macho', 'Pequeño', 'si', 'no', 'no', 'Un torbellino de alegría. Ideal para una persona activa.', NULL, 3, 3, 1, 3, 0, '2025-08-19 19:00:00'),
(56, 1, 'Nala', 'gato', 4, 'Hembra', 'Mediano', 'si', 'si', 'no', 'Cazadora de juguetes y experta en encontrar los lugares más cómodos.', NULL, 2, 2, 2, 2, 0, '2025-08-22 16:00:00'),
(57, 1, 'Jack', 'perro', 8, 'Macho', 'Grande', 'si', 'si', 'si', 'Un abuelo sabio y paciente. Solo quiere paz y amor.', NULL, 1, 3, 3, 1, 0, '2025-09-03 11:45:00'),
(58, 1, 'Mochi', 'gato', 1, 'Hembra', 'Pequeño', 'si', 'no', 'no', 'Una bolita de pelo dulce y tímida. Necesita un hogar paciente.', NULL, 1, 1, 1, 1, 0, '2025-09-07 20:00:00'),
(59, 1, 'Duke', 'perro', 5, 'Macho', 'Mediano', 'si', 'si', 'no', 'Un perro noble que se lleva bien con otros perros. Muy equilibrado.', NULL, 2, 3, 2, 2, 0, '2025-09-15 14:00:00'),
(60, 1, 'Gigi', 'gato', 3, 'Hembra', 'Pequeño', 'si', 'si', 'si', 'Glamorosa y exigente. Solo acepta las mejores caricias.', NULL, 1, 2, 2, 1, 0, '2025-09-19 10:00:00');

-- ####################################################################
-- ## INSERTS PARA ADOPCIONES DE TODAS LAS MASCOTAS DE LA ONG ID = 1 ##
-- ## REPARTIDAS EN EL ÚLTIMO TRIMESTRE (OCT-NOV-DIC 2025)         ##
-- ####################################################################

-- Adopciones para mascotas existentes de la ONG 1 (IDs: 20, 21, 22, 28, 29, 30, 31, 32, 39)
INSERT INTO `adopciones` (`id_usuario`, `id_mascota`, `id_ong`, `estado`, `fecha_inicio`, `fecha_actualizacion`) VALUES
(11, 20, 1, 2, '2025-10-01 10:15:00', '2025-10-05 18:00:00'), -- Aprobada en Octubre
(12, 21, 1, 2, '2025-10-02 11:00:00', '2025-10-08 12:30:00'), -- Aprobada en Octubre
(1, 22, 1, 2, '2025-10-03 14:00:00', '2025-10-10 16:45:00'), -- Aprobada en Octubre
(2, 28, 1, 2, '2025-10-04 09:30:00', '2025-10-12 11:00:00'), -- Aprobada en Octubre
(3, 29, 1, 2, '2025-10-05 16:00:00', '2025-10-15 19:20:00'), -- Aprobada en Octubre
(4, 30, 1, 2, '2025-10-06 18:20:00', '2025-10-18 10:00:00'), -- Aprobada en Octubre
(5, 31, 1, 2, '2025-10-07 12:00:00', '2025-10-20 14:00:00'), -- Aprobada en Octubre
(6, 32, 1, 2, '2025-10-08 15:10:00', '2025-10-22 17:00:00'), -- Aprobada en Octubre
(7, 39, 1, 2, '2025-10-09 11:45:00', '2025-10-25 09:00:00'); -- Aprobada en Octubre

-- Adopciones para las 20 nuevas mascotas (IDs: 41 a 60)

-- Octubre
INSERT INTO `adopciones` (`id_usuario`, `id_mascota`, `id_ong`, `estado`, `fecha_inicio`, `fecha_actualizacion`) VALUES
(8, 41, 1, 2, '2025-10-10 10:00:00', '2025-10-15 12:00:00'), -- Aprobada en Octubre
(9, 42, 1, 2, '2025-10-11 11:00:00', '2025-10-16 14:30:00'), -- Aprobada en Octubre
(11, 43, 1, 2, '2025-10-12 12:00:00', '2025-10-18 16:00:00'), -- Aprobada en Octubre
(12, 44, 1, 2, '2025-10-13 13:00:00', '2025-10-20 11:00:00'), -- Aprobada en Octubre
(1, 45, 1, 2, '2025-10-14 14:00:00', '2025-10-22 18:00:00'), -- Aprobada en Octubre
(2, 46, 1, 2, '2025-10-15 15:00:00', '2025-10-25 10:00:00'), -- Aprobada en Octubre
(3, 47, 1, 2, '2025-10-16 16:00:00', '2025-10-28 15:00:00'); -- Aprobada en Octubre

-- Noviembre
INSERT INTO `adopciones` (`id_usuario`, `id_mascota`, `id_ong`, `estado`, `fecha_inicio`, `fecha_actualizacion`) VALUES
(4, 48, 1, 2, '2025-09-25 10:00:00', '2025-10-01 12:00:00'), -- Aprobada en Octubre
(5, 49, 1, 2, '2025-09-28 11:00:00', '2025-10-02 14:30:00'), -- Aprobada en Octubre
(6, 50, 1, 2, '2025-10-01 12:00:00', '2025-10-06 16:00:00'), -- Aprobada en Octubre
(7, 51, 1, 2, '2025-10-02 13:00:00', '2025-10-07 11:00:00'), -- Aprobada en Octubre
(8, 52, 1, 2, '2025-10-03 14:00:00', '2025-10-09 18:00:00'), -- Aprobada en Octubre
(9, 53, 1, 2, '2025-10-04 15:00:00', '2025-10-11 10:00:00'), -- Aprobada en Octubre
(11, 54, 1, 2, '2025-10-05 16:00:00', '2025-10-12 15:00:00'); -- Aprobada en Octubre

-- Diciembre
INSERT INTO `adopciones` (`id_usuario`, `id_mascota`, `id_ong`, `estado`, `fecha_inicio`, `fecha_actualizacion`) VALUES
(12, 55, 1, 2, '2025-08-20 10:00:00', '2025-08-25 12:00:00'), -- Aprobada en Agosto
(1, 56, 1, 2, '2025-08-25 11:00:00', '2025-09-01 14:30:00'), -- Aprobada en Septiembre
(2, 57, 1, 2, '2025-09-05 12:00:00', '2025-09-10 16:00:00'), -- Aprobada en Septiembre
(3, 58, 1, 2, '2025-09-10 13:00:00', '2025-09-15 11:00:00'), -- Aprobada en Septiembre
(4, 59, 1, 2, '2025-09-16 14:00:00', '2025-09-22 18:00:00'), -- Aprobada en Septiembre
(5, 60, 1, 2, '2025-09-20 15:00:00', '2025-09-25 10:00:00'); -- Aprobada en Septiembre