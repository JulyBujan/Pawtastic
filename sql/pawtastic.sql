-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Feb 02, 2026 at 12:46 AM
-- Server version: 8.4.8
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pawtastic`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`%` PROCEDURE `calcular_compatibilidad_mascotas` (IN `id_usuario_in` INT)   BEGIN
    -- Declarar variables para almacenar las preferencias del usuario
    DECLARE user_energia TINYINT;
    DECLARE user_sociabilidad TINYINT;
    DECLARE user_presencia TINYINT;
    DECLARE user_estilov TINYINT;
    
    -- 1. Obtener las preferencias del usuario y verificar que no sean NULL
    SELECT 
        energia, sociabilidad, presencia, estilov
    INTO 
        user_energia, user_sociabilidad, user_presencia, user_estilov
    FROM 
        usuarios 
    WHERE 
        id = id_usuario_in;
        
    -- 2. Si alguna preferencia es NULL, no se puede calcular. Devolvemos un conjunto vacío.
    IF user_energia IS NULL OR user_sociabilidad IS NULL OR user_presencia IS NULL OR user_estilov IS NULL THEN
        -- Devuelve la estructura de la tabla esperada pero sin filas, para que el frontend no falle.
        SELECT 
            m.*,
            'El perfil del usuario está incompleto para calcular la compatibilidad.' AS compatibilidad
        FROM mascotas m WHERE 1=0;
    ELSE
        -- 3. Si las preferencias son válidas, calcular la compatibilidad
        SELECT 
            m.*,
            -- Calcular el porcentaje de compatibilidad
            -- La diferencia máxima es 8 ((3-1)*4). Una diferencia de 0 es 100%, una de 8 es 0%.
            -- Fórmula: 100 - (diferencia_total / diferencia_maxima) * 100
            ROUND(100 - ((ABS(m.energia - user_energia) + ABS(m.sociabilidad - user_sociabilidad) + ABS(m.presencia - user_presencia) + ABS(m.estilov - user_estilov)) / 8) * 100) AS compatibilidad
        FROM 
            mascotas m
        WHERE
            -- Solo incluir mascotas activas/disponibles para adopción
            m.estado = 0
        -- 4. Ordenar por compatibilidad de mayor a menor
        ORDER BY 
            compatibilidad DESC;
    END IF;

END$$

CREATE DEFINER=`root`@`%` PROCEDURE `calcular_distancia_mascotas` (IN `id_usuario_in` INT)   BEGIN
    -- Declarar variables para almacenar la ubicación del usuario
    DECLARE user_lat FLOAT;
    DECLARE user_lon FLOAT;
    
    -- 1. Obtener las coordenadas del usuario y verificar que no sean NULL
    SELECT 
        lat, lon
    INTO 
        user_lat, user_lon
    FROM 
        usuarios 
    WHERE 
        id = id_usuario_in;
        
    -- 2. Si las coordenadas son NULL, no se puede calcular. Devolvemos un conjunto vacío con un mensaje.
    IF user_lat IS NULL OR user_lon IS NULL THEN
        -- Devuelve la estructura de la tabla esperada pero sin filas.
        SELECT 
            m.*,
            'La ubicación del usuario no está definida para calcular la distancia.' AS distancia_km
        FROM mascotas m WHERE 1=0;
    ELSE
        -- 3. Si las coordenadas son válidas, calcular la distancia
        SELECT 
            m.*,
            -- Calcular la distancia en KM usando la fórmula de Haversine (CORREGIDA)
            -- R = 6371 (radio de la Tierra en km)
            ROUND(
                6371 * 2 * ASIN(SQRT(
                    POWER(SIN((user_lat - o.lat) * pi()/180 / 2), 2) +
                    COS(user_lat * pi()/180 ) * COS(o.lat * pi()/180) *
                    POWER(SIN((user_lon - o.lon) * pi()/180 / 2), 2)
                ))
            , 2) AS distancia_km
        FROM 
            mascotas m
        -- Unir con la tabla de ONGs para obtener sus coordenadas
        JOIN 
            ONGs o ON m.id_ong = o.id
        WHERE
            -- Solo incluir mascotas activas/disponibles para adopción
            m.estado = 0
            -- Y solo ONGs que tengan coordenadas válidas
            AND o.lat IS NOT NULL AND o.lon IS NOT NULL
        -- 4. Ordenar por distancia de menor a mayor (más cercanas primero)
        ORDER BY 
            distancia_km ASC;
    END IF;

END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `adopciones`
--

CREATE TABLE `adopciones` (
  `id` int NOT NULL,
  `id_usuario` int NOT NULL,
  `id_mascota` int NOT NULL,
  `id_ong` int NOT NULL,
  `comentarios` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `estado` int NOT NULL DEFAULT '0',
  `fecha_inicio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` timestamp NULL DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `adopciones`
--

INSERT INTO `adopciones` (`id`, `id_usuario`, `id_mascota`, `id_ong`, `comentarios`, `estado`, `fecha_inicio`, `fecha_fin`, `fecha_actualizacion`) VALUES
(9, 11, 33, 2, NULL, 0, '2026-01-30 23:24:16', NULL, '2026-01-30 23:24:16'),
(12, 11, 20, 1, NULL, 1, '2026-01-01 10:15:00', '2026-01-06 10:15:00', '2026-01-14 02:23:14'),
(13, 12, 21, 1, '[20/11/2025 01:05 - Usuario]: Quisiera saber si Isabella se lleva bien con perros. Muchas gracias!!', 1, '2026-01-02 11:00:00', '2026-01-17 11:00:00', '2026-01-20 01:05:44'),
(14, 1, 22, 1, NULL, 1, '2026-01-03 14:00:00', '2026-01-10 14:00:00', '2026-01-14 02:23:14'),
(15, 2, 28, 1, NULL, 1, '2026-01-04 09:30:00', '2026-01-12 09:30:00', '2026-01-14 02:23:14'),
(16, 3, 29, 1, NULL, 1, '2026-01-05 16:00:00', '2026-01-15 16:00:00', '2026-01-14 02:23:14'),
(17, 4, 30, 1, NULL, 1, '2026-01-06 18:20:00', '2026-01-18 18:20:00', '2026-01-14 02:23:14'),
(18, 5, 31, 1, NULL, 0, '2026-01-07 12:00:00', '2026-01-20 12:00:00', '2026-01-14 02:23:14'),
(19, 6, 32, 1, NULL, 1, '2026-01-08 15:10:00', '2026-01-22 15:10:00', '2026-01-14 02:23:14'),
(20, 7, 39, 1, NULL, 2, '2026-01-09 11:45:00', '2026-01-25 11:45:00', '2026-01-14 02:23:14'),
(21, 8, 41, 1, NULL, 1, '2026-01-10 10:00:00', '2026-01-15 10:00:00', '2026-01-14 02:23:14'),
(22, 9, 42, 1, NULL, 1, '2026-01-11 11:00:00', '2026-01-25 11:00:00', '2026-01-14 02:23:14'),
(23, 11, 43, 1, NULL, 1, '2026-01-12 12:00:00', '2026-01-17 12:00:00', '2026-01-14 02:23:14'),
(24, 12, 44, 1, NULL, 1, '2026-01-13 13:00:00', '2026-01-20 13:00:00', '2026-01-14 02:23:14'),
(25, 1, 45, 1, NULL, 1, '2026-01-14 14:00:00', '2026-01-22 14:00:00', '2026-01-14 02:23:14'),
(26, 2, 46, 1, NULL, 1, '2026-01-15 15:00:00', '2026-01-25 15:00:00', '2026-01-14 02:23:14'),
(27, 3, 47, 1, NULL, 2, '2026-01-16 16:00:00', '2026-01-28 16:00:00', '2026-01-14 02:23:14'),
(28, 4, 48, 1, NULL, 1, '2025-12-25 10:00:00', '2026-01-21 10:00:00', '2026-01-14 02:23:14'),
(29, 5, 49, 1, NULL, 1, '2025-12-28 11:00:00', '2026-01-02 11:00:00', '2026-01-14 02:23:14'),
(30, 6, 50, 1, NULL, 1, '2026-01-01 12:00:00', '2026-01-06 12:00:00', '2026-01-14 02:23:14'),
(31, 7, 51, 1, NULL, 2, '2026-01-02 13:00:00', '2026-01-17 13:00:00', '2026-01-14 02:23:14'),
(32, 8, 52, 1, NULL, 1, '2026-01-03 14:00:00', '2026-01-09 14:00:00', '2026-01-14 02:23:14'),
(33, 9, 53, 1, NULL, 1, '2026-01-04 15:00:00', '2026-01-21 15:00:00', '2026-01-14 02:23:14'),
(34, 11, 54, 1, NULL, 0, '2026-01-05 16:00:00', '2026-01-12 16:00:00', '2026-01-14 02:23:14'),
(35, 12, 55, 1, '[20/11/2025 01:06 - Usuario]: Me podrian contar si Toby puede convivir con niños? Tengo un sobrino de 12 años que vive conmigo. Mil gracias!', 1, '2025-12-20 10:00:00', '2025-12-24 10:00:00', '2026-01-20 01:06:38'),
(36, 1, 56, 1, NULL, 1, '2025-12-25 11:00:00', '2026-01-01 11:00:00', '2026-01-14 02:23:14'),
(37, 2, 57, 1, NULL, 1, '2025-12-05 12:00:00', '2025-12-20 12:00:00', '2026-01-14 02:23:14'),
(38, 3, 58, 1, NULL, 1, '2025-12-10 13:00:00', '2025-12-15 13:00:00', '2026-01-14 02:23:14'),
(39, 4, 59, 1, NULL, 1, '2025-12-16 14:00:00', '2026-01-12 14:00:00', '2026-01-14 02:23:14'),
(40, 5, 60, 1, NULL, 1, '2025-12-20 15:00:00', '2025-12-25 15:00:00', '2026-01-14 02:23:14'),
(55, 17, 61, 1, '[Usuario]: Estoy muy interesado en Rocky, parece el compañero ideal para mis salidas a correr.', 0, '2025-12-26 00:00:00', NULL, '2026-01-13 23:46:30'),
(56, 19, 63, 1, '[Usuario]: Me gustaría saber más sobre el carácter de Thor y si es posible visitarlo.', 0, '2025-12-15 00:00:00', NULL, '2026-01-13 23:46:30'),
(57, 20, 64, 1, '[Usuario]: Busco una gatita juguetona para mi departamento. Cleo parece perfecta.', 1, '2025-12-20 00:00:00', NULL, '2026-01-14 01:57:21'),
(58, 21, 70, 1, '[Usuario]: Tengo experiencia con gatos tímidos y me encantaría darle un hogar a Nala.', 1, '2026-01-23 00:00:00', NULL, '2026-01-23 00:00:00'),
(59, 18, 62, 1, '[Usuario]: Misha sería una gran compañía para mi otra mascota. Tenemos un patio grande.\n---\n[ONG]: Solicitud aprobada. Nos pondremos en contacto para coordinar la entrega.', 1, '2025-12-31 00:00:00', NULL, '2026-01-13 23:46:30'),
(60, 17, 66, 1, '[Usuario]: Busco un gato independiente y Simba parece ideal.\n---\n[ONG]: Hemos revisado tu perfil y aprobamos la solicitud. ¡Felicidades!', 1, '2025-12-17 00:00:00', NULL, '2026-01-13 23:46:30'),
(61, 19, 67, 1, '[Usuario]: ¡Qué cachorra tan bonita! Tenemos mucho amor y paciencia para darle.\n---\n[ONG]: ¡Luna ha encontrado un hogar! Solicitud aprobada.', 1, '2025-12-26 00:00:00', NULL, '2026-01-13 23:46:30'),
(62, 1, 20, 1, NULL, 1, '2026-01-05 10:00:00', '2026-01-12 10:00:00', '2026-01-12 10:00:00'),
(63, 2, 21, 1, NULL, 1, '2026-01-06 11:00:00', '2026-01-15 11:00:00', '2026-01-15 11:00:00'),
(64, 3, 22, 1, NULL, 1, '2026-01-07 09:30:00', '2026-01-20 09:30:00', '2026-01-20 09:30:00'),
(65, 4, 28, 1, NULL, 2, '2026-01-08 13:20:00', '2026-01-10 13:20:00', '2026-01-10 13:20:00'),
(66, 5, 29, 1, NULL, 1, '2026-01-09 15:00:00', '2026-01-18 15:00:00', '2026-01-18 15:00:00'),
(67, 6, 30, 1, NULL, 0, '2026-01-10 16:10:00', NULL, '2026-01-10 16:10:00'),
(68, 17, 31, 1, NULL, 0, '2026-01-11 12:40:00', NULL, '2026-01-11 12:40:00'),
(69, 18, 32, 1, NULL, 2, '2026-01-12 14:00:00', '2026-01-14 14:00:00', '2026-01-14 14:00:00'),
(70, 19, 39, 1, NULL, 1, '2026-01-13 11:00:00', '2026-01-22 11:00:00', '2026-01-22 11:00:00'),
(71, 20, 41, 1, NULL, 1, '2026-01-14 10:30:00', '2026-01-24 10:30:00', '2026-01-24 10:30:00'),
(72, 11, 42, 1, NULL, 1, '2026-01-15 09:00:00', '2026-01-25 09:00:00', '2026-01-25 09:00:00'),
(73, 12, 43, 1, NULL, 2, '2026-01-16 08:30:00', '2026-01-18 08:30:00', '2026-01-18 08:30:00'),
(74, 13, 44, 1, NULL, 0, '2026-01-17 12:00:00', NULL, '2026-01-17 12:00:00'),
(75, 21, 45, 1, NULL, 1, '2026-01-18 14:00:00', '2026-01-28 14:00:00', '2026-01-28 14:00:00'),
(76, 22, 46, 1, NULL, 1, '2026-01-19 15:30:00', '2026-01-29 15:30:00', '2026-01-29 15:30:00'),
(77, 16, 47, 1, NULL, 0, '2026-01-20 16:45:00', NULL, '2026-01-20 16:45:00'),
(78, 17, 48, 1, NULL, 1, '2026-01-21 10:15:00', '2026-01-30 10:15:00', '2026-01-30 10:15:00'),
(79, 18, 49, 1, NULL, 2, '2026-01-22 11:20:00', '2026-01-23 11:20:00', '2026-01-23 11:20:00'),
(80, 19, 50, 1, NULL, 1, '2026-01-23 13:10:00', '2026-01-31 13:10:00', '2026-01-31 13:10:00'),
(81, 20, 51, 1, NULL, 1, '2026-01-24 09:50:00', '2026-01-31 09:50:00', '2026-01-31 09:50:00'),
(82, 1, 83, 1, NULL, 1, '2026-01-10 10:00:00', '2026-01-15 10:00:00', '2026-01-15 10:00:00'),
(83, 2, 84, 1, NULL, 1, '2026-01-11 12:00:00', '2026-01-18 12:00:00', '2026-01-18 12:00:00'),
(84, 3, 85, 1, NULL, 1, '2026-01-12 09:30:00', '2026-01-19 09:30:00', '2026-01-19 09:30:00'),
(85, 4, 86, 1, NULL, 1, '2026-01-13 12:15:00', '2026-01-20 12:15:00', '2026-01-20 12:15:00'),
(86, 5, 87, 1, NULL, 1, '2026-01-14 10:45:00', '2026-01-21 10:45:00', '2026-01-21 10:45:00'),
(87, 6, 88, 1, NULL, 1, '2026-01-15 09:00:00', '2026-01-22 09:00:00', '2026-01-22 09:00:00'),
(88, 7, 89, 1, NULL, 1, '2026-01-16 14:20:00', '2026-01-23 14:20:00', '2026-01-23 14:20:00'),
(89, 8, 90, 1, NULL, 1, '2026-01-17 16:05:00', '2026-01-24 16:05:00', '2026-01-24 16:05:00'),
(90, 9, 91, 1, NULL, 1, '2026-01-18 13:10:00', '2026-01-25 13:10:00', '2026-01-25 13:10:00'),
(91, 10, 92, 1, NULL, 1, '2026-01-19 10:30:00', '2026-01-26 10:30:00', '2026-01-26 10:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `adopcion_eventos`
--

CREATE TABLE `adopcion_eventos` (
  `id` int NOT NULL,
  `adopcion_id` int NOT NULL,
  `actor_id` int NOT NULL,
  `tipo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_anterior` tinyint DEFAULT NULL,
  `estado_nuevo` tinyint DEFAULT NULL,
  `detalle` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `adopcion_eventos`
--

INSERT INTO `adopcion_eventos` (`id`, `adopcion_id`, `actor_id`, `tipo`, `estado_anterior`, `estado_nuevo`, `detalle`, `created_at`, `metadata`) VALUES
(1, 27, 11, 'postulacion_creada', NULL, 0, 'Nueva postulacion generada para pruebas.', '2026-01-26 03:21:52', '{\"seed\": true}'),
(2, 27, 11, 'comentario_agregado', NULL, NULL, 'Comentario de prueba para la ONG.', '2026-01-26 03:21:52', '{\"seed\": true, \"comentario\": \"Comentario de prueba para la ONG.\"}'),
(3, 27, 11, 'estado_actualizado', 0, 1, 'Estado actualizado a Aprobada (prueba).', '2026-01-26 03:21:52', '{\"seed\": true, \"estado_nuevo\": 1, \"estado_anterior\": 0}'),
(4, 62, 10, 'postulacion_creada', NULL, 0, 'Nueva postulacion para Elora', '2026-01-30 03:06:58', '{\"ong_id\": 1, \"mascota_id\": \"70\"}'),
(5, 20, 10, 'comentario_agregado', NULL, NULL, 'Golfo no es recomendable para vivir en casas donde haya otras mascotas.', '2026-01-30 21:06:42', '{\"comentario\": \"Golfo no es recomendable para vivir en casas donde haya otras mascotas.\"}');

-- --------------------------------------------------------

--
-- Table structure for table `documentacion_ong`
--

CREATE TABLE `documentacion_ong` (
  `id` int NOT NULL,
  `ong_id` int NOT NULL,
  `url_estatuto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_cuit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_acta` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` tinyint NOT NULL DEFAULT '0' COMMENT '0: Pendiente, 1: Aprobado, 2: Rechazado',
  `fecha_subida` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `documentacion_ong`
--

INSERT INTO `documentacion_ong` (`id`, `ong_id`, `url_estatuto`, `url_cuit`, `url_acta`, `estado`, `fecha_subida`, `fecha_revision`) VALUES
(1, 7, 'documentos_ong/ong_7_estatuto_6978237c3908c.pdf', 'documentos_ong/ong_7_constancia_cuit_6978237c3915f.pdf', 'documentos_ong/ong_7_acta_autoridades_6978237c391bc.pdf', 0, '2026-01-27 02:31:24', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `ImagenesMascota`
--

CREATE TABLE `ImagenesMascota` (
  `id` int NOT NULL,
  `mascota_id` int NOT NULL,
  `url_imagen` varchar(255) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ImagenesMascota`
--

INSERT INTO `ImagenesMascota` (`id`, `mascota_id`, `url_imagen`, `descripcion`) VALUES
(1, 70, 'mascota_extra_697c1a0522749_cat-1853372_1280.jpg', NULL),
(2, 70, 'mascota_extra_697c1a660f244_cat-5618328_1280.jpg', NULL),
(3, 70, 'mascota_extra_697c1a9017c52_cat-468232_1280.jpg', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `mascotas`
--

CREATE TABLE `mascotas` (
  `id` int NOT NULL,
  `id_ong` int NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `edad` int DEFAULT NULL,
  `sexo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tamaño` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vacunado` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `esterilizado` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chip` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apto_ninos` int NOT NULL DEFAULT '1',
  `apto_mascotas` int NOT NULL DEFAULT '1',
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `breed` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `energia` tinyint DEFAULT NULL,
  `sociabilidad` tinyint DEFAULT NULL,
  `presencia` tinyint DEFAULT NULL,
  `estilov` tinyint DEFAULT NULL,
  `estado` tinyint NOT NULL DEFAULT '1',
  `date_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_publicacion` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mascotas`
--

INSERT INTO `mascotas` (`id`, `id_ong`, `nombre`, `tipo`, `edad`, `sexo`, `tamaño`, `vacunado`, `esterilizado`, `chip`, `apto_ninos`, `apto_mascotas`, `descripcion`, `breed`, `color`, `imagen`, `energia`, `sociabilidad`, `presencia`, `estilov`, `estado`, `date_update`, `date_publicacion`) VALUES
(11, 1, 'Mimi', 'perro', 38, 'Hembra', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Perrita amorosa, juguetona. Una exelente compañera de mimos y expediciones.', NULL, NULL, 'mascota_691e4100bfbdf_Mimi.jpg', 3, 3, 2, 3, 1, '2026-01-09 21:02:43', '2026-01-09 21:02:43'),
(12, 1, 'Carrie', 'perro', 47, 'Hembra', 'Mediano', 'si', 'si', 'no', 1, 1, 'Perra muy sociable, se lleva bien con otros perros y gatos.', NULL, NULL, 'mascota_691354641c4af_schnauzer-5232202_1280.jpg', 3, 3, 1, 2, 1, '2026-01-10 00:41:33', '2026-01-10 00:41:33'),
(13, 1, 'Batman', 'gato', 28, 'Macho', 'Mediano', 'si', 'si', 'si', 1, 1, 'Gato con alma de super heroe pero superado por la pereza', NULL, NULL, 'mascota_691e40e63db75_Batman.jpg', 1, 1, 1, 1, 1, '2026-01-11 17:45:39', '2026-01-11 17:45:39'),
(14, 2, 'Ulises', 'gato', 88, 'Macho', 'Grande', 'si', 'si', 'no', 1, 1, 'Escapista y caminante lunar', NULL, NULL, 'mascota_691648fe7ec85_black-cat-2680541_1280.jpg', 3, 2, 1, 2, 1, '2026-01-13 21:09:18', '2026-01-13 21:09:18'),
(20, 1, 'Amorina', 'perro', 64, 'Hembra', 'Mediano', 'si', 'no', 'no', 1, 1, 'Cariñosa y protectora, ideal para familias con niños. Le encanta salir a pasear y recibir mimos.', NULL, NULL, 'mascota_691e40d5e269e_Amorina.jpg', 2, 2, 3, 3, 0, '2026-01-29 20:29:20', '2026-01-29 00:06:14'),
(21, 1, 'Isabella', 'gato', 170, 'Hembra', 'Pequeño', 'si', 'si', 'si', 1, 1, 'Muy limpia y observadora. Se adapta bien a hogares tranquilos. Ideal para departamentos.', NULL, NULL, 'mascota_69181e9d90956_Isabella.jpg', 1, 1, 1, 1, 0, '2026-01-29 21:13:16', '2026-01-26 00:06:14'),
(22, 1, 'Ringo', 'perro', 66, 'Macho', 'Grande', 'no', 'no', 'no', 1, 1, 'Juguetón y obediente. Excelente para hogares con patio. Le gusta correr y jugar con pelotas.', NULL, NULL, 'mascota_69181cd21c389_Ringo.jpg', 3, 3, 2, 2, 0, '2026-01-29 21:20:00', '2026-01-23 00:06:14'),
(23, 2, 'Messi', 'gato', 15, 'Macho', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Es un gatito bicolor, gris y blanco. Está en la etapa de máxima exploración y desarrollo. Todavía es pequeño con 4 meses de edad, pero ya ha mostrando su personalidad. Ya está entrenado para usar el arenero solito, ya come balanceado pequeño y pollo cortado en pequeños trozos. Ya está listo para sumarse a una nueva familia que le brinde un cálido hogar y mucho amor.', NULL, NULL, 'mascota_691e4d6f8078c_Messi.jpg', 3, 3, 3, 3, 1, '2026-01-29 21:29:34', '2026-01-19 00:06:14'),
(28, 1, 'Pocha', 'gato', 50, 'Hembra', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Gata que exige rascadas de lomo.', NULL, NULL, 'mascota_691e40bfc12b2_Pocha.jpg', 2, 2, 1, 3, 0, '2026-01-30 02:49:08', '2026-01-09 00:06:14'),
(29, 1, 'Gordo', 'gato', 101, 'Macho', 'Grande', 'si', 'no', 'si', 1, 1, 'Ocho kilos de amor demandante', NULL, NULL, 'mascota_69181c9e3e104_Gordo.jpg', 2, 2, 2, 1, 0, '2026-01-30 19:11:09', '2026-01-03 00:06:14'),
(30, 1, 'Snoopy', 'perro', 70, 'Macho', 'Mediano', 'si', 'no', 'no', 1, 1, 'Beagle famoso por ser el perro de Charlie Brown.', NULL, NULL, 'mascota_691e404639315_Snoopy.jpg', 2, 3, 1, 2, 0, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(31, 1, 'Scooby-Doo', 'perro', 43, 'Macho', 'Grande', 'si', 'no', 'no', 1, 1, 'Dálmata miedoso y glotón, resuelve misterios con sus amigos.', NULL, NULL, 'mascota_69137509c440d_perro1.jpg', 1, 3, 3, 3, 0, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(32, 1, 'Pluto', 'perro', 99, 'Macho', 'Mediano', 'si', 'no', 'no', 1, 1, 'El leal perro de Mickey Mouse, es juguetón y curioso.', NULL, NULL, 'mascota_691374e478000_perro7.jpg', 3, 3, 2, 2, 0, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(33, 2, 'Beethoven', 'perro', 51, 'Macho', 'Grande', 'si', 'no', 'si', 1, 1, 'Un San Bernardo gigante y travieso pero de buen corazón.', NULL, NULL, 'img_6903ef44d587b.jpg', 2, 2, 3, 2, 0, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(34, 2, 'Toto', 'perro', 39, 'Macho', 'Pequeño', 'si', 'si', 'no', 1, 1, 'Pequeño Cairn terrier que acompañó a Dorothy en la tierra de Oz.', NULL, NULL, 'img_6903ef84c5324.jpg', 3, 1, 2, 1, 2, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(35, 2, 'Balto', 'perro', 77, 'Macho', 'Grande', 'si', 'si', 'si', 1, 1, 'Valiente perro de trineo que lideró una expedición para salvar a su pueblo en Alaska.', NULL, NULL, 'mascota_691e4d5d16d53_Balto.jpg', 3, 3, 1, 3, 0, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(36, 3, 'Lassie', 'perro', 69, 'Hembra', 'Grande', 'si', 'si', 'no', 1, 1, 'Una Collie hermosa e inteligente, famosa por rescatar gente.', NULL, NULL, 'mascota_691e4af91d4dc_Lassie.jpg', 2, 3, 3, 2, 0, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(37, 3, 'Marley', 'perro', 25, 'Macho', 'Grande', 'si', 'no', 'si', 1, 1, 'Un Labrador retriever adorable pero muy destructivo, protagonista de \"Marley y yo\".', NULL, NULL, 'mascota_691e4aae2a940_Marley.jpg', 3, 3, 3, 3, 0, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(38, 3, 'Milú', 'perro', 49, 'Macho', 'Mediano', 'si', 'si', 'no', 1, 1, 'El inseparable Fox terrier blanco de Tintín, aventurero y leal.', NULL, NULL, 'mascota_691e4a7794140_Milu.jpg', 2, 2, 1, 2, 0, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(39, 1, 'Golfo', 'perro', 82, 'Macho', 'Mediano', 'si', 'no', 'no', 1, 1, 'Perro callejero, encantador y muy sociable.', NULL, NULL, 'mascota_69181df274756_Golfo.jpg', 2, 3, 1, 3, 0, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(40, 2, 'Benji', 'perro', 71, 'Macho', 'Pequeño', 'si', 'si', 'no', 1, 1, 'Un perro mestizo muy inteligente y heroico que siempre está en el lugar correcto para ayudar.', NULL, NULL, 'mascota_691e4d41c676a_Benji.jpg', 2, 2, 1, 2, 0, '2026-01-21 02:45:45', '2026-01-20 02:17:34'),
(41, 1, 'Rocky', 'perro', 2, 'Macho', 'Mediano', 'si', 'si', 'no', 1, 1, 'Un perro leal y enérgico, siempre listo para una aventura.', NULL, NULL, 'mascota_69181b1ae1242_Rocky.jpg', 3, 3, 2, 3, 0, '2026-01-13 22:23:05', '2025-12-15 10:00:00'),
(42, 1, 'Milanesa', 'gato', 13, 'Hembra', 'Pequeño', 'si', 'si', 'no', 1, 1, 'Una gatita curiosa y juguetona que adora las siestas al sol.', NULL, NULL, 'mascota_69181aef295c8_Milanesa.jpg', 2, 2, 1, 1, 0, '2026-01-13 22:23:05', '2025-12-20 11:30:00'),
(43, 1, 'Gigante', 'perro', 65, 'Macho', 'Grande', 'si', 'si', 'si', 1, 1, 'Un gigante noble y tranquilo. Perfecto para una familia con espacio.', NULL, NULL, 'mascota_69181a7663d35_Thor.jpg', 1, 3, 3, 2, 0, '2026-01-13 22:23:05', '2025-12-01 14:00:00'),
(44, 1, 'Luna', 'gato', 51, 'Hembra', 'Mediano', 'si', 'si', 'no', 1, 1, 'Elegante y un poco tímida al principio, pero muy cariñosa.', NULL, NULL, 'mascota_69181a12c831c_Luna.jpg', 1, 1, 2, 1, 0, '2026-01-13 22:23:05', '2025-12-05 09:00:00'),
(45, 1, 'Coco', 'perro', 4, 'Macho', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Cachorro lleno de energía y travesuras. Necesita entrenamiento y paciencia.', NULL, NULL, 'mascota_6918199d16f8d_Coco.jpg', 3, 2, 1, 3, 0, '2026-01-13 22:23:05', '2025-12-10 16:45:00'),
(46, 1, 'Pinina', 'gato', 18, 'Hembra', 'Pequeño', 'si', 'si', 'si', 1, 1, 'Una dama tranquila que solo busca un regazo cálido y mimos.', NULL, NULL, 'mascota_6918196ed133a_Pinina.jpg', 1, 2, 3, 1, 0, '2026-01-13 22:23:05', '2025-12-12 18:00:00'),
(47, 1, 'Leo', 'perro', 40, 'Macho', 'Mediano', 'si', 'si', 'no', 1, 1, 'Inteligente y obediente, aprende trucos con facilidad.', NULL, NULL, 'mascota_6918193a914ec_Leo.jpg', 2, 3, 2, 2, 0, '2026-01-13 22:23:05', '2025-12-18 12:00:00'),
(48, 1, 'Simba', 'gato', 36, 'Macho', 'Grande', 'si', 'si', 'no', 1, 1, 'Un gato majestuoso con espíritu de líder. Le gusta explorar.', NULL, NULL, 'mascota_6918190e4d4cf_Simba.jpg', 3, 2, 2, 3, 0, '2026-01-13 22:23:05', '2025-12-20 13:10:00'),
(49, 1, 'Lola', 'perro', 175, 'Hembra', 'Pequeño', 'si', 'si', 'si', 1, 1, 'Una perrita senior muy dulce, ideal para compañía tranquila.', NULL, NULL, 'mascota_691818dba80be_Lola.jpg', 1, 3, 3, 1, 0, '2026-01-13 22:23:05', '2025-12-25 11:00:00'),
(50, 1, 'Marcos', 'gato', 49, 'Macho', 'Grande', 'si', 'no', 'no', 1, 1, 'Un gatito aventurero y muy sociable, se lleva bien con todos.', NULL, NULL, 'mascota_6918188021554_Oliver.jpg', 3, 3, 1, 2, 0, '2026-01-13 22:23:05', '2025-12-28 15:00:00'),
(51, 1, 'Max', 'perro', 27, 'Macho', 'Grande', 'si', 'si', 'no', 1, 1, 'Guardián por naturaleza, pero un osito de peluche con su familia.', NULL, NULL, 'mascota_6918185a968f1_Max.jpg', 2, 2, 3, 3, 0, '2026-01-13 22:23:05', '2025-12-16 10:00:00'),
(52, 1, 'Cleopatra', 'gato', 17, 'Hembra', 'Mediano', 'si', 'si', 'si', 1, 1, 'Una gata independiente que sabe lo que quiere. Reina de la casa.', NULL, NULL, 'mascota_6918182e71d53_Cleopatra.jpg', 1, 1, 2, 1, 0, '2026-01-13 22:23:05', '2025-12-17 14:20:00'),
(53, 1, 'Bruno', 'perro', 54, 'Macho', 'Mediano', 'si', 'si', 'no', 1, 1, 'Compañero fiel para largas caminatas. Se porta excelente con correa.', NULL, NULL, 'mascota_691817e2877a0_Bruno.jpg', 2, 3, 2, 2, 0, '2026-01-13 22:23:05', '2025-12-18 17:00:00'),
(54, 1, 'Zoe', 'gato', 26, 'Hembra', 'Pequeño', 'si', 'si', 'no', 1, 1, 'Juguetona y muy vocal. Le encanta \"conversar\" con sus humanos.', NULL, NULL, 'mascota_691817a6b2af0_Zoe.jpg', 3, 2, 1, 2, 0, '2026-01-13 22:23:05', '2025-12-14 09:30:00'),
(55, 1, 'Toby', 'perro', 1, 'Macho', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Un torbellino de alegría. Ideal para una persona activa.', NULL, NULL, 'mascota_6918176f0558f_Tobi.jpg', 3, 3, 1, 3, 0, '2026-01-13 22:23:05', '2025-12-19 19:00:00'),
(56, 1, 'Mirta', 'gato', 64, 'Hembra', 'Mediano', 'si', 'si', 'no', 1, 1, 'Cazadora de juguetes y experta en encontrar los lugares más cómodos.', NULL, NULL, 'mascota_6918171493615_Nala.jpg', 2, 2, 2, 2, 0, '2026-01-13 22:23:05', '2025-12-22 16:00:00'),
(57, 1, 'Jack', 'perro', 128, 'Macho', 'Mediano', 'si', 'si', 'si', 1, 1, 'Un abuelo sabio y paciente. Solo quiere paz y amor.', NULL, NULL, 'mascota_691816dea243b_Jack.jpg', 1, 3, 3, 1, 0, '2026-01-13 22:23:05', '2025-12-03 11:45:00'),
(58, 1, 'Mochi', 'gato', 1, 'Hembra', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Una bolita de pelo dulce y tímida. Necesita un hogar paciente.', NULL, NULL, 'mascota_691816745acd4_Mochi.jpg', 1, 1, 1, 1, 0, '2026-01-13 22:23:05', '2025-12-07 20:00:00'),
(59, 1, 'Duke', 'perro', 5, 'Macho', 'Mediano', 'si', 'si', 'no', 1, 1, 'Un perro noble que se lleva bien con otros perros. Muy equilibrado.', NULL, NULL, 'mascota_69181607dd516_Duke.jpg', 2, 3, 2, 2, 0, '2026-01-13 22:23:05', '2025-12-15 14:00:00'),
(60, 1, 'Gigi', 'gato', 3, 'Hembra', 'Pequeño', 'si', 'si', 'si', 1, 1, 'Glamorosa y exigente. Solo acepta las mejores caricias.', NULL, NULL, 'mascota_691813b4d302c_Gigi.jpg', 1, 2, 2, 1, 0, '2026-01-13 22:23:05', '2025-12-19 10:00:00'),
(61, 1, 'Diego', 'perro', 7, 'Macho', 'Mediano', 'si', 'no', 'no', 1, 1, 'Un perro leal y enérgico, siempre listo para jugar a la pelota.', NULL, NULL, 'mascota_69181fb6c0f99_perro3.jpg', 3, 3, 2, 2, 0, '2026-01-13 23:45:24', '2025-12-20 00:00:00'),
(62, 1, 'Misha', 'gato', 4, 'Hembra', 'Pequeño', 'si', 'si', 'no', 1, 1, 'Una gatita tranquila que ama las siestas al sol y los mimos suaves.', NULL, NULL, 'mascota_69181fdf0e613_gato1.jpg', 1, 2, 1, 1, 0, '2026-01-13 23:45:24', '2025-12-23 00:00:00'),
(63, 1, 'Thor', 'perro', 48, 'Macho', 'Grande', 'si', 'si', 'si', 0, 0, 'Un grandulón con corazón de oro, prefiere ser la única mascota del hogar.', NULL, NULL, 'mascota_691e3fad4f212_Thor.jpg', 2, 1, 3, 3, 0, '2026-01-13 23:45:24', '2025-12-27 00:00:00'),
(64, 1, 'Cleo', 'gato', 6, 'Hembra', 'Pequeño', 'no', 'no', 'no', 1, 1, 'Curiosa y juguetona, le encanta perseguir punteros láser.', NULL, NULL, 'mascota_691e3f6fd805b_Cleo.jpg', 3, 3, 2, 1, 0, '2026-01-13 23:45:24', '2025-12-04 00:00:00'),
(65, 1, 'Buddy', 'perro', 30, 'Macho', 'Mediano', 'si', 'no', 'no', 1, 1, 'El compañero perfecto para caminatas, se lleva bien con todos.', NULL, NULL, 'mascota_691e3f021c7af_Buddy.jpg', 2, 3, 2, 2, 0, '2026-01-13 23:45:24', '2025-12-09 00:00:00'),
(66, 1, 'Blacky', 'gato', 18, 'Macho', 'Mediano', 'si', 'si', 'no', 1, 0, 'Un gato majestuoso y algo territorial. Ideal como mascota única.', NULL, NULL, 'mascota_691e3ee53230b_Blacky.jpg', 2, 1, 1, 2, 0, '2026-01-13 23:45:24', '2025-12-16 00:00:00'),
(67, 1, 'Sol', 'perro', 8, 'Hembra', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Cachorra adorable y llena de vida, está aprendiendo a socializar.', NULL, NULL, 'mascota_69181d7b9dcc8_Sol.jpg', 3, 2, 3, 1, 0, '2026-01-13 23:45:24', '2025-12-24 00:00:00'),
(68, 1, 'Jesus', 'gato', 36, 'Macho', 'Mediano', 'si', 'si', 'si', 1, 1, 'Un gato muy inteligente y cariñoso que responde a su nombre.', NULL, NULL, 'mascota_69181f61bb6aa_Oliver2.jpg', 2, 2, 2, 1, 0, '2026-01-13 23:45:24', '2025-12-29 00:00:00'),
(69, 1, 'Daisy', 'perro', 60, 'Hembra', 'Grande', 'si', 'si', 'no', 1, 1, 'Una perra adulta muy tranquila y obediente, perfecta para una familia.', NULL, NULL, 'mascota_69181d1c0f514_Daisy.jpg', 1, 3, 1, 2, 0, '2026-01-13 23:45:24', '2026-01-09 00:00:00'),
(70, 1, 'Elora', 'gato', 20, 'Hembra', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Dulce y un poco tímida al principio, pero muy leal una vez que confía.', NULL, NULL, 'mascota_69181f0657a3c_Elora.jpg', 1, 1, 2, 1, 0, '2026-01-13 23:45:24', '2026-01-14 00:00:00'),
(71, 1, 'Nina', 'perro', 14, 'Hembra', 'Pequeño', 'si', 'si', 'no', 1, 1, 'Muy curiosa y juguetona, ideal para un hogar tranquilo.', NULL, NULL, 'mascota_69181d7b9dcc8_Sol.jpg', 2, 2, 2, 2, 1, '2026-01-18 09:40:00', '2026-01-18 09:40:00'),
(72, 1, 'Tango', 'perro', 48, 'Macho', 'Mediano', 'si', 'si', 'no', 1, 1, 'Le encanta salir a pasear y es muy sociable con otros perros.', NULL, NULL, 'mascota_69181b1ae1242_Rocky.jpg', 2, 3, 2, 2, 1, '2026-01-19 11:10:00', '2026-01-19 11:10:00'),
(73, 1, 'Pipa', 'gato', 10, 'Hembra', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Gatita dulce que disfruta las siestas al sol.', NULL, NULL, 'mascota_69181aef295c8_Milanesa.jpg', 1, 2, 2, 1, 1, '2026-01-20 13:20:00', '2026-01-20 13:20:00'),
(74, 1, 'Beto', 'perro', 72, 'Macho', 'Grande', 'si', 'si', 'si', 1, 1, 'Gigante tranquilo, ideal para familias con patio.', NULL, NULL, 'mascota_69181a7663d35_Thor.jpg', 1, 3, 2, 2, 0, '2026-01-21 15:05:00', '2026-01-21 15:05:00'),
(75, 1, 'Mora', 'gato', 30, 'Hembra', 'Mediano', 'si', 'si', 'no', 1, 1, 'Carinosa y elegante, se adapta rapido a nuevos entornos.', NULL, NULL, 'mascota_69181a12c831c_Luna.jpg', 1, 1, 2, 1, 1, '2026-01-22 10:30:00', '2026-01-22 10:30:00'),
(76, 1, 'Sultan', 'perro', 54, 'Macho', 'Grande', 'si', 'no', 'no', 1, 1, 'Activo y obediente, responde bien al entrenamiento.', NULL, NULL, 'mascota_69181cd21c389_Ringo.jpg', 3, 3, 2, 3, 1, '2026-01-23 12:45:00', '2026-01-23 12:45:00'),
(77, 1, 'Kira', 'gato', 24, 'Hembra', 'Pequeño', 'si', 'si', 'si', 1, 1, 'Curiosa y muy limpia, perfecta para departamento.', NULL, NULL, 'mascota_69181e9d90956_Isabella.jpg', 1, 2, 1, 1, 1, '2026-01-24 09:15:00', '2026-01-24 09:15:00'),
(78, 1, 'Roco', 'perro', 36, 'Macho', 'Mediano', 'si', 'si', 'no', 1, 1, 'Jugueton y sociable, le encantan los paseos largos.', NULL, NULL, 'mascota_69181c9e3e104_Gordo.jpg', 2, 3, 2, 2, 1, '2026-01-25 14:10:00', '2026-01-25 14:10:00'),
(79, 1, 'Milo', 'perro', 20, 'Macho', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Cachorro inquieto que busca un hogar con energia.', NULL, NULL, 'mascota_6918199d16f8d_Coco.jpg', 3, 3, 2, 3, 0, '2026-01-26 16:00:00', '2026-01-26 16:00:00'),
(80, 1, 'Lina', 'gato', 44, 'Hembra', 'Mediano', 'si', 'si', 'no', 1, 1, 'Gatita tranquila, le gusta observar y ser mimada.', NULL, NULL, 'mascota_6918196ed133a_Pinina.jpg', 1, 2, 2, 1, 0, '2026-01-27 11:35:00', '2026-01-27 11:35:00'),
(81, 1, 'Brisa', 'perro', 62, 'Hembra', 'Mediano', 'si', 'si', 'no', 1, 1, 'Muy companera, ideal para caminatas diarias.', NULL, NULL, 'mascota_69181fb6c0f99_perro3.jpg', 2, 2, 2, 2, 1, '2026-01-28 13:50:00', '2026-01-28 13:50:00'),
(82, 1, 'Tita', 'gato', 8, 'Hembra', 'Pequeño', 'si', 'no', 'no', 1, 1, 'Juguetona y curiosa, aprende rapido el arenero.', NULL, NULL, 'mascota_69181fdf0e613_gato1.jpg', 3, 2, 2, 1, 1, '2026-01-29 10:05:00', '2026-01-29 10:05:00'),
(83, 1, 'Brownie', 'perro', 24, 'Macho', 'Mediano', 'si', 'si', 'no', 1, 1, 'Dulce y tranquilo, ideal para paseos cortos y mimos.', NULL, NULL, 'mascota_69181b1ae1242_Rocky.jpg', 2, 2, 2, 2, 1, '2026-01-02 10:00:00', '2026-01-02 10:00:00'),
(84, 1, 'Kiara', 'gato', 18, 'Hembra', 'Mediano', 'si', 'si', 'no', 1, 1, 'Curiosa y mimosa, se adapta rapido a nuevos hogares.', NULL, NULL, 'mascota_69181aef295c8_Milanesa.jpg', 2, 2, 2, 2, 1, '2026-01-03 11:00:00', '2026-01-03 11:00:00'),
(85, 1, 'Nube', 'perro', 36, 'Hembra', 'Grande', 'si', 'no', 'no', 1, 1, 'Companera fiel, muy obediente y sociable.', NULL, NULL, 'mascota_69181c9e3e104_Gordo.jpg', 2, 3, 2, 2, 1, '2026-01-04 09:30:00', '2026-01-04 09:30:00'),
(86, 1, 'Lola', 'gato', 30, 'Hembra', 'Mediano', 'si', 'si', 'si', 1, 1, 'Gatita tranquila, le gustan las siestas al sol.', NULL, NULL, 'mascota_69181a12c831c_Luna.jpg', 1, 2, 1, 1, 1, '2026-01-05 12:15:00', '2026-01-05 12:15:00'),
(87, 1, 'Paco', 'perro', 48, 'Macho', 'Grande', 'si', 'si', 'no', 1, 1, 'Activo y jugueton, ideal para familias con patio.', NULL, NULL, 'mascota_69181df274756_Golfo.jpg', 3, 3, 2, 3, 1, '2026-01-06 10:45:00', '2026-01-06 10:45:00'),
(88, 1, 'Mora', 'gato', 22, 'Hembra', 'Mediano', 'si', 'si', 'no', 1, 1, 'Elegante y curiosa, muy companera.', NULL, NULL, 'mascota_69181fdf0e613_gato1.jpg', 2, 2, 2, 2, 1, '2026-01-07 09:00:00', '2026-01-07 09:00:00'),
(89, 1, 'Dante', 'perro', 60, 'Macho', 'Mediano', 'si', 'no', 'no', 1, 1, 'Muy carinoso, perfecto para acompanarte en caminatas.', NULL, NULL, 'mascota_69181fb6c0f99_perro3.jpg', 2, 2, 2, 2, 1, '2026-01-08 14:20:00', '2026-01-08 14:20:00'),
(90, 1, 'Tiza', 'gato', 14, 'Hembra', 'Mediano', 'si', 'si', 'no', 1, 1, 'Juguetona y sociable, se adapta rapido.', NULL, NULL, 'mascota_691e40e63db75_Batman.jpg', 3, 2, 2, 2, 1, '2026-01-09 16:05:00', '2026-01-09 16:05:00'),
(91, 1, 'Rita', 'perro', 30, 'Hembra', 'Mediano', 'si', 'si', 'si', 1, 1, 'Le encanta jugar y aprender trucos nuevos.', NULL, NULL, 'mascota_69181cd21c389_Ringo.jpg', 3, 3, 2, 3, 1, '2026-01-10 13:10:00', '2026-01-10 13:10:00'),
(92, 1, 'Sasha', 'gato', 26, 'Hembra', 'Mediano', 'si', 'si', 'no', 1, 1, 'Cariñosa y observadora, ideal para hogar tranquilo.', NULL, NULL, 'mascota_69181d7b9dcc8_Sol.jpg', 1, 2, 1, 1, 1, '2026-01-11 10:30:00', '2026-01-11 10:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `mascota_vacunas`
--

CREATE TABLE `mascota_vacunas` (
  `id_mascota` int NOT NULL,
  `id_vacuna` int NOT NULL,
  `fecha_aplicacion` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `mascota_vacunas`
--

INSERT INTO `mascota_vacunas` (`id_mascota`, `id_vacuna`, `fecha_aplicacion`) VALUES
(36, 1, '2020-12-23'),
(37, 1, '2023-04-01'),
(40, 1, '2020-05-23'),
(72, 3, '2026-01-11'),
(36, 7, '2020-12-23'),
(37, 7, '2023-04-01'),
(38, 7, '2022-08-19'),
(40, 7, '2020-05-23'),
(69, 7, '2022-06-29'),
(36, 8, '2022-12-23'),
(38, 8, '2023-08-19'),
(40, 8, '2022-05-23'),
(13, 9, '2019-12-08'),
(66, 9, '2023-01-18'),
(13, 10, '2025-11-13'),
(13, 10, '2026-01-13'),
(60, 10, '2025-11-15'),
(60, 10, '2026-01-15'),
(70, 10, '2026-01-07'),
(13, 11, '2023-06-04'),
(68, 11, '2026-01-29');

-- --------------------------------------------------------

--
-- Table structure for table `lost_found_posts`
--

CREATE TABLE `lost_found_posts` (
  `id` int NOT NULL,
  `type` enum('LOST','FOUND') NOT NULL,
  `user_id` int DEFAULT NULL,
  `pet_name` varchar(100) DEFAULT NULL,
  `species` varchar(30) NOT NULL,
  `breed` varchar(80) DEFAULT NULL,
  `colors` varchar(255) DEFAULT NULL,
  `size` enum('small','medium','large') DEFAULT NULL,
  `location_text` varchar(120) NOT NULL,
  `suburb` varchar(80) DEFAULT NULL,
  `lat` float DEFAULT NULL,
  `lon` float DEFAULT NULL,
  `date_seen` date DEFAULT NULL,
  `description` text,
  `photo_url` varchar(255) DEFAULT NULL,
  `status` enum('OPEN','RESOLVED') NOT NULL DEFAULT 'OPEN',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lost_found_posts`
--

INSERT INTO `lost_found_posts` (`id`, `type`, `user_id`, `pet_name`, `species`, `breed`, `colors`, `size`, `location_text`, `suburb`, `lat`, `lon`, `date_seen`, `description`, `photo_url`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(2, 'FOUND', 8, NULL, 'Perro', 'Mestizo', 'negro, blanco', 'medium', 'Bv. Los Granaderos, Córdoba', 'Los Granaderos', -31.387, -64.135, '2026-01-30', 'Encontrado cerca de una plaza.', 'img/mascotas/default.jpg', 'OPEN', '2026-01-30 11:12:00', '2026-01-30 11:12:00', NULL),
(4, 'FOUND', 2, NULL, 'Gato', 'Siames', 'crema', 'small', 'Alta Córdoba', 'Alta Córdoba', -31.403, -64.184, '2026-01-26', 'Apareció en el patio del edificio.', 'img/mascotas/default.jpg', 'OPEN', '2026-01-26 14:05:00', '2026-01-26 14:05:00', NULL),
(6, 'FOUND', 7, NULL, 'Perro', 'Labrador', 'marron, blanco', 'large', 'Cerro de las rosas', 'Cerro de las rosas', -31.373, -64.255, '2026-02-02', 'Se acercó a la puerta del refugio.', 'img/mascotas/default.jpg', 'OPEN', '2026-02-02 08:45:00', '2026-02-02 08:45:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `lost_found_messages`
--

CREATE TABLE `lost_found_messages` (
  `id` int NOT NULL,
  `post_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `recipient_id` int NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lost_found_messages`
--


-- --------------------------------------------------------

--
-- Table structure for table `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `actor_id` int DEFAULT NULL,
  `tipo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cuerpo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entidad_tipo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entidad_id` int DEFAULT NULL,
  `leida_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payload` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notificaciones`
--

INSERT INTO `notificaciones` (`id`, `usuario_id`, `actor_id`, `tipo`, `titulo`, `cuerpo`, `entidad_tipo`, `entidad_id`, `leida_at`, `created_at`, `payload`) VALUES
(1, 10, 11, 'postulacion_creada', 'Nueva postulacion', 'Nueva postulacion para una mascota.', 'adopcion', 27, '2026-01-27 19:26:29', '2026-01-26 01:21:52', '{\"mascota_id\": 47, \"adopcion_id\": 27}'),
(2, 10, 11, 'comentario_agregado', 'Nuevo comentario', 'Se agrego un comentario en una postulacion.', 'adopcion', 27, '2026-01-27 19:26:26', '2026-01-26 02:36:52', '{\"mascota_id\": 47, \"adopcion_id\": 27}'),
(3, 10, 11, 'estado_actualizado', 'Estado actualizado', 'Una postulacion fue aprobada (prueba).', 'adopcion', 27, '2026-01-26 03:11:52', '2026-01-26 03:01:52', '{\"mascota_id\": 47, \"adopcion_id\": 27, \"estado_nuevo\": 1}'),
(4, 10, 10, 'mascota_creada', 'Mascota publicada', 'Publicaste a Buddy.', 'mascota', 72, '2026-01-27 19:37:39', '2026-01-27 19:37:16', '{\"mascota_id\": 72}'),
(5, 10, 10, 'vacuna_agregada', 'Vacuna agregada', 'Agregaste Antirábica de gatos a Elora.', 'mascota', 70, '2026-01-30 01:28:40', '2026-01-30 01:27:02', '{\"vacuna_id\": \"10\", \"mascota_id\": \"70\"}'),
(6, 10, 10, 'mascota_actualizada', 'Mascota actualizada', 'Actualizaste los datos de Elora.', 'mascota', 70, '2026-01-30 01:28:56', '2026-01-30 01:27:17', '{\"mascota_id\": 70}'),
(7, 10, 10, 'vacuna_agregada', 'Vacuna agregada', 'Agregaste Rabia (Primera dosis) a Daisy.', 'mascota', 69, '2026-01-30 01:41:37', '2026-01-30 01:41:01', '{\"vacuna_id\": \"7\", \"mascota_id\": \"69\"}'),
(8, 10, 10, 'mascota_actualizada', 'Mascota actualizada', 'Actualizaste los datos de Daisy.', 'mascota', 69, '2026-01-30 01:41:27', '2026-01-30 01:41:09', '{\"mascota_id\": 69}'),
(9, 10, 10, 'vacuna_agregada', 'Vacuna agregada', 'Agregaste Leucemia felina a Jesus.', 'mascota', 68, '2026-01-30 01:47:31', '2026-01-30 01:47:17', '{\"vacuna_id\": \"11\", \"mascota_id\": \"68\"}'),
(10, 10, 10, 'mascota_actualizada', 'Mascota actualizada', 'Actualizaste los datos de Jesus.', 'mascota', 68, '2026-01-30 01:47:29', '2026-01-30 01:47:19', '{\"mascota_id\": 68}'),
(11, 10, 10, 'mascota_actualizada', 'Mascota actualizada', 'Actualizaste los datos de Elora.', 'mascota', 70, '2026-02-02 00:37:40', '2026-01-30 02:40:05', '{\"mascota_id\": 70}'),
(12, 10, 10, 'mascota_actualizada', 'Mascota actualizada', 'Actualizaste los datos de Elora.', 'mascota', 70, '2026-02-02 00:37:35', '2026-01-30 02:41:42', '{\"mascota_id\": 70}'),
(13, 10, 10, 'mascota_actualizada', 'Mascota actualizada', 'Actualizaste los datos de Elora.', 'mascota', 70, '2026-01-30 03:15:12', '2026-01-30 02:42:24', '{\"mascota_id\": 70}'),
(14, 10, 10, 'postulacion_creada', 'Nueva postulacion', 'Nueva postulacion para Elora.', 'adopcion', 62, '2026-01-30 03:15:09', '2026-01-30 03:06:58', '{\"mascota_id\": \"70\", \"adopcion_id\": 62}'),
(15, 7, 10, 'comentario_agregado', 'Nuevo comentario', 'Nuevo comentario en la postulacion de Golfo.', 'adopcion', 20, NULL, '2026-01-30 21:06:42', '{\"mascota_id\": 39, \"adopcion_id\": \"20\"}');

-- --------------------------------------------------------

--
-- Table structure for table `ONGs`
--

CREATE TABLE `ONGs` (
  `id` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `razon_social` varchar(255) DEFAULT NULL,
  `cuit` varchar(13) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `lat` float NOT NULL DEFAULT '-31',
  `lon` float NOT NULL DEFAULT '-64',
  `city` varchar(31) NOT NULL,
  `suburb` varchar(31) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `road` varchar(50) NOT NULL,
  `house_number` int NOT NULL DEFAULT '0',
  `departamento` varchar(8) DEFAULT NULL,
  `fecha_constitucion` timestamp NULL DEFAULT NULL,
  `ultima_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ONGs`
--

INSERT INTO `ONGs` (`id`, `nombre`, `razon_social`, `cuit`, `lat`, `lon`, `city`, `suburb`, `road`, `house_number`, `departamento`, `fecha_constitucion`, `ultima_actualizacion`) VALUES
(1, 'Patitas de perro', 'Fundación Patita de Perro', '30-12345678-1', -31.3847, -64.227, 'Cordoba', 'Cerro de las rosas', 'Mariano Larra', 3350, NULL, NULL, '2026-01-03 09:49:51'),
(2, 'Huellas', 'Huellas Asociación Civil', '30-87654321-2', -31.4188, -64.1735, 'Cordoba', 'Barrio Gral. Paz', 'Rosario de Sta. Fe', 650, NULL, NULL, '2026-01-03 09:59:46'),
(3, 'Fundación Garra', 'Grupo de asistencia,rescate y readaptación animal', '30-11223344-3', -31.3776, -64.2058, 'Cordoba', 'San Martin Anexo', 'Av. Monseñor Pablo Cabrera', 2926, NULL, NULL, '2026-01-03 10:19:11'),
(6, 'Asociación Protectora de Animales Sarmiento', 'Centro de Castraciones Sarmiento', '30-11223345-7', -31.4201, -64.1501, 'Cordoba', 'Barrio San Vicente', 'Sgto. Cabral', 1031, NULL, NULL, '2026-01-03 10:16:02'),
(7, 'Patitas Felices', 'Patitas Sociedad Anonima', '30-12345377-3', 0, 0, 'Cordoba', 'cordoba', 'Siempre viva', 3665, NULL, '2026-01-22 00:00:00', '2026-01-27 02:31:24');

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Almacena el hash SHA-256 de la contraseña',
  `tipo` enum('usuario','ong','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'usuario',
  `ong_id` int DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_documento` tinyint DEFAULT NULL,
  `documento` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_perfil_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` enum('Masculino','Femenino','Otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lat` float DEFAULT NULL,
  `lon` float DEFAULT NULL,
  `city` varchar(31) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suburb` varchar(31) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `road` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `house_number` int NOT NULL DEFAULT '0',
  `departamento` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_casa` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otras_mascotas` int NOT NULL DEFAULT '0',
  `experiencia` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `energia` tinyint DEFAULT NULL,
  `sociabilidad` tinyint DEFAULT NULL,
  `presencia` tinyint DEFAULT NULL,
  `estilov` tinyint DEFAULT NULL,
  `ultima_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` tinyint NOT NULL DEFAULT '0',
  `tokenv` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id`, `email`, `password`, `tipo`, `ong_id`, `nombre`, `apellido`, `tipo_documento`, `documento`, `telefono`, `foto_perfil_url`, `fecha_nacimiento`, `sexo`, `lat`, `lon`, `city`, `suburb`, `road`, `house_number`, `departamento`, `tipo_casa`, `otras_mascotas`, `experiencia`, `energia`, `sociabilidad`, `presencia`, `estilov`, `ultima_actualizacion`, `fecha_registro`, `estado`, `tokenv`) VALUES
(1, 'ana.garcia0@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Ana', 'García', NULL, NULL, '1122334400', NULL, '1990-01-15', 'Femenino', -31.4252, -64.2247, 'Córdoba', 'San Rafael', NULL, 0, NULL, 'Casa con patio', 0, 'Primeriza', NULL, NULL, NULL, NULL, '2026-01-20 02:15:27', '2026-01-20 02:10:51', 1, NULL),
(2, 'juan.rodriguez1@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Juan', 'Rodriguez', NULL, NULL, '1122334401', NULL, '1991-01-15', 'Masculino', -31.4433, -64.1518, 'Córdoba', 'Jardín del Pilar', NULL, 0, NULL, 'Departamento', 0, 'Intermedia', NULL, NULL, NULL, NULL, '2026-01-20 02:02:36', '2026-01-20 02:10:51', 0, NULL),
(3, 'maria.martinez2@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Maria', 'Martinez', NULL, NULL, '1122334402', NULL, '1992-01-15', 'Femenino', -31.4251, -64.2318, 'Córdoba', 'Los Plátanos', NULL, 0, NULL, 'Casa con patio', 0, 'Avanzada', NULL, NULL, NULL, NULL, '2026-01-20 02:06:17', '2026-01-20 02:10:52', 0, NULL),
(4, 'carlos.lopez3@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Carlos', 'Lopez', NULL, NULL, '1122334403', NULL, '1993-01-15', 'Masculino', -31.3893, -64.1434, 'Córdoba', 'Nueva Italia', NULL, 0, NULL, 'Departamento', 0, 'Primeriza', NULL, NULL, NULL, NULL, '2026-01-20 02:11:18', '2026-01-20 02:10:52', 0, NULL),
(5, 'laura.gonzalez4@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Laura', 'Gonzalez', NULL, NULL, '1122334404', NULL, '1994-01-15', 'Femenino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Casa con patio', 0, 'Intermedia', NULL, NULL, NULL, NULL, '2026-01-20 02:10:52', '2026-01-20 02:10:52', 0, NULL),
(6, 'pedro.perez5@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Pedro', 'Perez', NULL, NULL, '1122334405', NULL, '1995-01-15', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Departamento', 0, 'Avanzada', NULL, NULL, NULL, NULL, '2026-01-20 02:10:52', '2026-01-20 02:10:52', 0, NULL),
(7, 'sofia.sanchez6@ong.com', '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'ong', NULL, 'Sofia', 'Sanchez', NULL, NULL, '1122334406', NULL, '1996-01-15', 'Femenino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Casa con patio', 0, 'Primeriza', NULL, NULL, NULL, NULL, '2026-01-19 22:59:04', '2026-01-20 02:10:52', 0, NULL),
(8, 'luis@ong3.org', '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'ong', 3, 'Luis', 'Romero', NULL, NULL, '1122334407', NULL, '1997-01-15', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Departamento', 0, 'Intermedia', NULL, NULL, NULL, NULL, '2026-01-19 22:43:58', '2026-01-20 02:10:52', 0, NULL),
(9, 'marco@ong2.org', '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'ong', 2, 'Marco', 'Polo', NULL, NULL, '1122334408', NULL, '1998-01-15', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Casa con patio', 0, 'Avanzada', NULL, NULL, NULL, NULL, '2026-01-29 02:29:35', '2026-01-20 02:10:52', 0, NULL),
(10, 'javier@ong1.org', '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'ong', 1, 'Javier', 'Diaz', NULL, NULL, '1122334409', NULL, '1999-01-15', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Departamento', 0, 'Primeriza', NULL, NULL, NULL, NULL, '2026-01-22 22:30:02', '2026-01-20 02:10:52', 0, NULL),
(11, 'sbujan@gmail.com', '8146cedca9d6bfb47b77f581973da5a0bee365aa9ec9ebb5b12d142fca2c3cc1', 'usuario', NULL, 'Sergio Ezequiel', 'Bujan', 0, '29364773', '0111536250164', NULL, '1982-03-20', 'Masculino', -31.365, -64.2245, 'Córdoba', 'Cerro Chico', 'Juan Cruz Varela', 2876, '', NULL, 0, 'amplia', 2, 2, 3, 3, '2026-01-03 22:20:00', '2026-01-22 02:46:37', 0, NULL),
(12, 'jhon@house.com', 'b391fa64cb3fcb7c64b02a528c2d0514ba9c93fc1611b557ede0b91ef88ec9ae', 'usuario', NULL, 'Maria', 'Flores', 0, '374599623', '351789653', '/img/profile/user_691e63752c6fd_MariaFlores.png', '1993-02-01', 'Femenino', -31.3799, -64.197, 'Córdoba', 'Los Paraisos', 'Arquímedes', 2857, '', 'Casa con patio', 2, 'Tengo un gato de 2 años de edad, me gustaría encontrarle un compañero para las horas que estoy fuera de casa por trabajo. ', 2, 2, 2, 2, '2026-01-20 15:14:14', '2026-01-25 18:53:08', 0, 'a90979d90f1d313e400fe05315d520fac72e007bd70454a2d83599a8a9373a99'),
(13, 'maria@house.com.ar', '626e3c805e77eeb472c42c6be607be2af7ac5c08fd7050f278e0330fe81abf57', 'usuario', NULL, 'mariapepa', 'Sil', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-01-10 18:44:24', '2026-01-30 20:03:50', 0, '4fb2be2cfa8855179396c22905d370a931627ed1752c5140c814bf9fa3fd24ce'),
(14, 'admin@pawtastic.pet', 'd82494f05d6917ba02f7aaa29689ccb444bb73f20380876cb05d1f37537b7892', 'admin', NULL, 'Admin', 'Moderador', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-01-03 23:21:53', '2026-01-03 23:21:09', 0, 'f7aa521b586295709bcd8722be3eb155869f129ef46f5c7111872057529bb98e'),
(15, 'mariapepa@house.com', '626e3c805e77eeb472c42c6be607be2af7ac5c08fd7050f278e0330fe81abf57', 'usuario', NULL, 'Maria', 'Pepa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-01-09 04:25:49', '2026-01-09 04:25:49', 1, '7ec4ed532c058bac82ec3f3dc0eedabaa0841a1f8ecbcde61e9171ad260504cd'),
(16, 'florpepa@gmail.com', '97f9caecd2834e0baaf7263749ec01f43d2f89161065c3ceba48382b287a9c2c', 'usuario', NULL, 'Florencia', 'pepa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-01-13 16:45:21', '2026-01-09 04:28:56', 1, '3f076e6920c88b996c4458267270435bd2a0766c1d850da31e830e5a1758a4c9'),
(17, 'carlos.gomez@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Carlos', 'Gomez', NULL, NULL, '3510000017', NULL, '1995-05-20', 'Masculino', -31.42, -64.18, 'Córdoba', NULL, NULL, 0, NULL, 'Departamento', 0, 'Primeriza', 2, 3, 1, 1, '2026-01-13 23:44:52', '2025-12-25 00:00:00', 1, NULL),
(18, 'lucia.fernandez@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Lucía', 'Fernandez', NULL, NULL, '3510000018', NULL, '1988-11-10', 'Femenino', -31.39, -64.23, 'Córdoba', NULL, NULL, 0, NULL, 'Casa con patio', 1, 'Avanzada', 3, 3, 3, 3, '2026-01-13 23:44:52', '2025-12-30 00:00:00', 1, NULL),
(19, 'martin.torres@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Martín', 'Torres', NULL, NULL, '3510000019', NULL, '2000-02-25', 'Masculino', -31.45, -64.15, 'Córdoba', NULL, NULL, 0, NULL, 'Casa con patio', 0, 'Intermedia', 3, 2, 2, 2, '2026-01-13 23:44:52', '2025-12-14 00:00:00', 1, NULL),
(20, 'valentina.diaz@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Valentina', 'Diaz', NULL, NULL, '3510000020', NULL, '1992-09-30', 'Femenino', -31.41, -64.2, 'Córdoba', NULL, NULL, 0, NULL, 'Departamento', 1, 'Intermedia', 1, 1, 1, 1, '2026-01-13 23:44:52', '2025-12-19 00:00:00', 1, NULL),
(21, 'diego.ruiz@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Diego', 'Ruiz', NULL, NULL, '3510000021', NULL, '1985-07-12', 'Masculino', -31.37, -64.25, 'Córdoba', NULL, NULL, 0, NULL, 'Casa con patio', 2, 'Avanzada', 2, 3, 2, 3, '2026-01-13 23:44:52', '2026-01-04 00:00:00', 1, NULL),
(22, 'jonathanary7@gmail.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'usuario', NULL, 'jonathan', 'ary', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-01-20 00:58:12', '2026-01-20 00:58:12', 1, '6d19fa215d18479c9c7a18fb7e56abe668b1371499a54e4320734be870b63efd');

-- --------------------------------------------------------

--
-- Table structure for table `usuario_notificacion_preferencias`
--

CREATE TABLE `usuario_notificacion_preferencias` (
  `id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `tipo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `habilitado` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vacunas`
--

CREATE TABLE `vacunas` (
  `id_vacuna` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` varchar(10) NOT NULL,
  `descripcion` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `vacunas`
--

INSERT INTO `vacunas` (`id_vacuna`, `nombre`, `tipo`, `descripcion`) VALUES
(1, 'Vacuna Polivalente (séxtuple)', 'perro', 'Protege contra moquillo, parvovirus y hepatitis, entre otras enfermedades. A las 6 semanas de vida.'),
(3, 'Polivalente (Segunda dosis)', 'perro', 'A las 8 semanas de vida que combate el adenovirus, el moquillo, la parainfluenza y el parvovirus.'),
(5, 'Polivalente Refuerzo', 'perro', 'A las 12 semanas de vida.'),
(7, 'Rabia (Primera dosis)', 'perro', 'A las 16 semanas de vida.'),
(8, 'Rabia (Refuerzo)', 'perro', 'Cada año.'),
(9, 'Trivalente Felina', 'gato', 'Recomendada después del destete.  Inmuniza contra rinotraqueítis, calicivirus y panleucopenia.'),
(10, 'Antirábica de gatos', 'gato', 'Es obligatoria para gatos y se recomienda su aplicación a partir de los 4 meses de edad, con refuerzos anuales.'),
(11, 'Leucemia felina', 'gato', 'Es recomendada, sobre todo si el gato sale a la calle (outdoor). ');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `adopciones`
--
ALTER TABLE `adopciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_mascota` (`id_mascota`),
  ADD KEY `id_ong` (`id_ong`);

--
-- Indexes for table `adopcion_eventos`
--
ALTER TABLE `adopcion_eventos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `adopcion_id` (`adopcion_id`),
  ADD KEY `actor_id` (`actor_id`);

--
-- Indexes for table `documentacion_ong`
--
ALTER TABLE `documentacion_ong`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ong_id_unico` (`ong_id`);

--
-- Indexes for table `ImagenesMascota`
--
ALTER TABLE `ImagenesMascota`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mascota_id` (`mascota_id`);

--
-- Indexes for table `mascotas`
--
ALTER TABLE `mascotas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_mascota_ong` (`id_ong`);

--
-- Indexes for table `mascota_vacunas`
--
ALTER TABLE `mascota_vacunas`
  ADD PRIMARY KEY (`id_mascota`,`id_vacuna`,`fecha_aplicacion`),
  ADD KEY `id_vacuna` (`id_vacuna`);

--
-- Indexes for table `lost_found_posts`
--
ALTER TABLE `lost_found_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lost_found_type_status` (`type`,`status`),
  ADD KEY `idx_lost_found_species` (`species`),
  ADD KEY `idx_lost_found_date_seen` (`date_seen`);

--
-- Indexes for table `lost_found_messages`
--
ALTER TABLE `lost_found_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lost_found_msg_post` (`post_id`),
  ADD KEY `idx_lost_found_msg_sender` (`sender_id`),
  ADD KEY `idx_lost_found_msg_recipient` (`recipient_id`),
  ADD KEY `idx_lost_found_msg_created` (`created_at`);

--
-- Indexes for table `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `actor_id` (`actor_id`),
  ADD KEY `idx_notif_user_unread` (`usuario_id`,`leida_at`,`created_at`);

--
-- Indexes for table `ONGs`
--
ALTER TABLE `ONGs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cuit` (`cuit`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_unico` (`email`),
  ADD KEY `ong_id` (`ong_id`);

--
-- Indexes for table `usuario_notificacion_preferencias`
--
ALTER TABLE `usuario_notificacion_preferencias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_usuario_tipo` (`usuario_id`,`tipo`);

--
-- Indexes for table `vacunas`
--
ALTER TABLE `vacunas`
  ADD PRIMARY KEY (`id_vacuna`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `adopciones`
--
ALTER TABLE `adopciones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `adopcion_eventos`
--
ALTER TABLE `adopcion_eventos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `documentacion_ong`
--
ALTER TABLE `documentacion_ong`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ImagenesMascota`
--
ALTER TABLE `ImagenesMascota`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `mascotas`
--
ALTER TABLE `mascotas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT for table `lost_found_posts`
--
ALTER TABLE `lost_found_posts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `lost_found_messages`
--
ALTER TABLE `lost_found_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `ONGs`
--
ALTER TABLE `ONGs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `usuario_notificacion_preferencias`
--
ALTER TABLE `usuario_notificacion_preferencias`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vacunas`
--
ALTER TABLE `vacunas`
  MODIFY `id_vacuna` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `adopciones`
--
ALTER TABLE `adopciones`
  ADD CONSTRAINT `adopciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `adopciones_ibfk_2` FOREIGN KEY (`id_mascota`) REFERENCES `mascotas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `adopciones_ibfk_3` FOREIGN KEY (`id_ong`) REFERENCES `ONGs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `adopcion_eventos`
--
ALTER TABLE `adopcion_eventos`
  ADD CONSTRAINT `adopcion_eventos_ibfk_1` FOREIGN KEY (`adopcion_id`) REFERENCES `adopciones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `adopcion_eventos_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `documentacion_ong`
--
ALTER TABLE `documentacion_ong`
  ADD CONSTRAINT `fk_documentacion_ong` FOREIGN KEY (`ong_id`) REFERENCES `ONGs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ImagenesMascota`
--
ALTER TABLE `ImagenesMascota`
  ADD CONSTRAINT `ImagenesMascota_ibfk_1` FOREIGN KEY (`mascota_id`) REFERENCES `mascotas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `mascotas`
--
ALTER TABLE `mascotas`
  ADD CONSTRAINT `fk_mascota_ong` FOREIGN KEY (`id_ong`) REFERENCES `ONGs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `mascota_vacunas`
--
ALTER TABLE `mascota_vacunas`
  ADD CONSTRAINT `mascota_vacunas_ibfk_1` FOREIGN KEY (`id_mascota`) REFERENCES `mascotas` (`id`),
  ADD CONSTRAINT `mascota_vacunas_ibfk_2` FOREIGN KEY (`id_vacuna`) REFERENCES `vacunas` (`id_vacuna`);

--
-- Constraints for table `lost_found_messages`
--
ALTER TABLE `lost_found_messages`
  ADD CONSTRAINT `lost_found_messages_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `lost_found_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lost_found_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lost_found_messages_ibfk_3` FOREIGN KEY (`recipient_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`ong_id`) REFERENCES `ONGs` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `usuario_notificacion_preferencias`
--
ALTER TABLE `usuario_notificacion_preferencias`
  ADD CONSTRAINT `usuario_notificacion_preferencias_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
