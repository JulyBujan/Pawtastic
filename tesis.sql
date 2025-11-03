-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Nov 03, 2025 at 04:41 PM
-- Server version: 9.4.0
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tesis`
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
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `adopciones`
--

INSERT INTO `adopciones` (`id`, `id_usuario`, `id_mascota`, `id_ong`, `comentarios`, `estado`, `fecha_inicio`, `fecha_actualizacion`) VALUES
(6, 12, 21, 1, NULL, 0, '2025-10-30 23:01:55', '2025-10-30 23:01:55'),
(7, 12, 28, 1, '[30/10/2025 23:03 - Usuario]: Esperando instrucciones.', 0, '2025-10-30 23:03:01', '2025-10-30 23:03:35'),
(8, 11, 20, 1, NULL, 0, '2025-10-30 23:22:34', '2025-10-30 23:22:34'),
(9, 11, 33, 2, NULL, 0, '2025-10-30 23:24:16', '2025-10-30 23:24:16');

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

-- --------------------------------------------------------

--
-- Table structure for table `mascotas`
--

CREATE TABLE `mascotas` (
  `id` int NOT NULL,
  `id_ong` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `edad` int DEFAULT NULL,
  `sexo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tamaño` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vacunado` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `esterilizado` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chip` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `imagen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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

INSERT INTO `mascotas` (`id`, `id_ong`, `nombre`, `tipo`, `edad`, `sexo`, `tamaño`, `vacunado`, `esterilizado`, `chip`, `descripcion`, `imagen`, `energia`, `sociabilidad`, `presencia`, `estilov`, `estado`, `date_update`, `date_publicacion`) VALUES
(20, 1, 'Amorina', 'perro', 3, 'Hembra', 'Pequeño', 'si', 'si', 'no', 'Cariñosa y protectora, ideal para familias con niños. Le encanta salir a pasear y recibir mimos.', 'mascota_690279220251c_bulldog.jpg', 2, 2, 3, 3, 0, '2025-10-29 20:29:20', '2025-10-29 00:06:14'),
(21, 1, 'Isabella', 'gato', 14, 'Hembra', 'Pequeño', 'si', 'si', 'si', 'Muy limpia y observadora. Se adapta bien a hogares tranquilos. Ideal para departamentos.', 'mascota_6902836dea528_cat-persa-adulto-negro.jpg', 1, 1, 1, 1, 0, '2025-10-29 21:13:16', '2025-10-26 00:06:14'),
(22, 1, 'Ringo', 'perro', 5, 'Macho', 'Grande', 'no', 'no', 'no', 'Juguetón y obediente. Excelente para hogares con patio. Le gusta correr y jugar con pelotas.', 'mascota_6902850151c60_rhodesian-perro-adulto.jpg', 3, 3, 2, 2, 0, '2025-10-29 21:20:00', '2025-10-23 00:06:14'),
(23, 2, 'Messi', 'gato', 1, 'Macho', 'Pequeño', 'si', 'no', 'no', 'Es un gatito bicolor, gris y blanco. Está en la etapa de máxima exploración y desarrollo. Todavía es pequeño con 4 meses de edad, pero ya ha mostrando su personalidad. Ya está entrenado para usar el arenero solito, ya come balanceado pequeño y pollo cortado en pequeños trozos. Ya está listo para sumarse a una nueva familia que le brinde un cálido hogar y mucho amor.', NULL, 3, 3, 3, 3, 1, '2025-10-29 21:29:34', '2025-10-19 00:06:14'),
(28, 1, 'Pocha', 'gato', 4, 'Hembra', 'Pequeño', 'si', 'si', 'no', 'Gata que exige rascadas de lomo. ', NULL, 2, 2, 1, 3, 0, '2025-10-30 02:49:08', '2025-10-09 00:06:14'),
(29, 1, 'Gio', 'gato', 8, 'Macho', 'Grande', 'si', 'si', 'si', 'Ocho kilos de amor demandante', 'img_6903e99c67b97.jpg', 2, 3, 2, 1, 0, '2025-10-30 19:11:09', '2025-10-03 00:06:14'),
(30, 1, 'Snoopy', 'perro', 5, 'Macho', 'Mediano', 'si', 'si', 'no', 'Beagle famoso por ser el perro de Charlie Brown.', 'img_6903fb703724a.jpg', 2, 3, 1, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(31, 1, 'Scooby-Doo', 'perro', 7, 'Macho', 'Grande', 'si', 'no', 'no', 'Gran Danés miedoso y glotón, resuelve misterios con sus amigos.', NULL, 1, 3, 3, 1, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(32, 1, 'Pluto', 'perro', 8, 'Macho', 'Mediano', 'si', 'si', 'no', 'El leal perro de Mickey Mouse, es juguetón y curioso.', NULL, 3, 3, 2, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(33, 2, 'Beethoven', 'perro', 4, 'Macho', 'Grande', 'si', 'no', 'si', 'Un San Bernardo gigante y travieso pero de buen corazón.', 'img_6903ef44d587b.jpg', 2, 2, 3, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(34, 2, 'Toto', 'perro', 3, 'Macho', 'Pequeño', 'si', 'si', 'no', 'Pequeño Cairn terrier que acompañó a Dorothy en la tierra de Oz.', 'img_6903ef84c5324.jpg', 3, 1, 2, 1, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(35, 2, 'Balto', 'perro', 6, 'Macho', 'Grande', 'si', 'si', 'si', 'Valiente perro de trineo que lideró una expedición para salvar a su pueblo en Alaska.', NULL, 3, 3, 1, 3, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(36, 3, 'Lassie', 'perro', 5, 'Hembra', 'Grande', 'si', 'si', 'no', 'Una Collie hermosa e inteligente, famosa por rescatar gente.', NULL, 2, 3, 3, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(37, 3, 'Marley', 'perro', 2, 'Macho', 'Grande', 'si', 'no', 'si', 'Un Labrador retriever adorable pero muy destructivo, protagonista de \"Marley y yo\".', NULL, 3, 3, 3, 3, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(38, 3, 'Milú', 'perro', 4, 'Macho', 'Pequeño', 'si', 'si', 'no', 'El inseparable Fox terrier blanco de Tintín, aventurero y leal.', NULL, 2, 2, 1, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(39, 1, 'Golfo', 'perro', 6, 'Macho', 'Mediano', 'si', 'no', 'no', 'Perro callejero, encantador y astuto de \"La Dama y el Vagabundo\".', 'img_6903fb85a1cc5.jpg', 2, 3, 1, 3, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(40, 2, 'Benji', 'perro', 5, 'Macho', 'Pequeño', 'si', 'si', 'no', 'Un perro mestizo muy inteligente y heroico que siempre está en el lugar correcto para ayudar.', 'img_6903efbfd18c2.jpg', 2, 2, 1, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34');

-- --------------------------------------------------------

--
-- Table structure for table `ONGs`
--

CREATE TABLE `ONGs` (
  `id` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `razon_social` varchar(255) DEFAULT NULL,
  `cuit` varchar(13) DEFAULT NULL,
  `lat` float NOT NULL,
  `lon` float NOT NULL,
  `city` varchar(31) NOT NULL,
  `suburb` varchar(31) NOT NULL,
  `road` varchar(50) NOT NULL,
  `house_number` int NOT NULL DEFAULT '0',
  `departamento` varchar(8) DEFAULT NULL,
  `ultima_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ONGs`
--

INSERT INTO `ONGs` (`id`, `nombre`, `razon_social`, `cuit`, `lat`, `lon`, `city`, `suburb`, `road`, `house_number`, `departamento`, `ultima_actualizacion`) VALUES
(1, 'Patitas de perro', 'Fundación Patita de Perro', '30-12345678-1', -31.3847, -64.227, 'Cordoba', 'Cerro de las rosas', 'Mariano Larra', 3350, NULL, '2025-11-03 09:49:51'),
(2, 'Huellas', 'Huellas Asociación Civil', '30-87654321-2', -31.4188, -64.1735, 'Cordoba', 'Barrio Gral. Paz', 'Rosario de Sta. Fe', 650, NULL, '2025-11-03 09:59:46'),
(3, 'Fundación Garra', 'Grupo de asistencia,rescate y readaptación animal', '30-11223344-3', -31.3776, -64.2058, 'Cordoba', 'San Martin Anexo', 'Av. Monseñor Pablo Cabrera', 2926, NULL, '2025-11-03 10:19:11'),
(6, 'Asociación Protectora de Animales Sarmiento', 'Centro de Castraciones Sarmiento', '30-11223345-7', -31.4201, -64.1501, 'Cordoba', 'Barrio San Vicente', 'Sgto. Cabral', 1031, NULL, '2025-11-03 10:16:02');

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Almacena el hash SHA-256 de la contraseña',
  `tipo` enum('usuario','ong','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'usuario',
  `ong_id` int DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_documento` tinyint DEFAULT NULL,
  `documento` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_perfil_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` enum('Masculino','Femenino','Otro') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lat` float DEFAULT NULL,
  `lon` float DEFAULT NULL,
  `city` varchar(31) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suburb` varchar(31) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `road` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `house_number` int NOT NULL DEFAULT '0',
  `departamento` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_casa` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otras_mascotas` int NOT NULL DEFAULT '0',
  `experiencia` text COLLATE utf8mb4_unicode_ci,
  `energia` tinyint DEFAULT NULL,
  `sociabilidad` tinyint DEFAULT NULL,
  `presencia` tinyint DEFAULT NULL,
  `estilov` tinyint DEFAULT NULL,
  `ultima_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` tinyint NOT NULL DEFAULT '0',
  `tokenv` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id`, `email`, `password`, `tipo`, `ong_id`, `nombre`, `apellido`, `tipo_documento`, `documento`, `telefono`, `foto_perfil_url`, `fecha_nacimiento`, `sexo`, `lat`, `lon`, `city`, `suburb`, `road`, `house_number`, `departamento`, `tipo_casa`, `otras_mascotas`, `experiencia`, `energia`, `sociabilidad`, `presencia`, `estilov`, `ultima_actualizacion`, `fecha_registro`, `estado`, `tokenv`) VALUES
(1, 'ana.garcia0@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Ana', 'García', NULL, NULL, '1122334400', NULL, '1990-01-15', 'Femenino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Casa con patio', 0, 'Primeriza', NULL, NULL, NULL, NULL, '2025-10-20 02:10:51', '2025-10-20 02:10:51', 0, NULL),
(2, 'juan.rodriguez1@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Juan', 'Rodriguez', NULL, NULL, '1122334401', NULL, '1991-01-15', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Departamento', 0, 'Intermedia', NULL, NULL, NULL, NULL, '2025-10-20 02:10:51', '2025-10-20 02:10:51', 0, NULL),
(3, 'maria.martinez2@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Maria', 'Martinez', NULL, NULL, '1122334402', NULL, '1992-01-15', 'Femenino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Casa con patio', 0, 'Avanzada', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(4, 'carlos.lopez3@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Carlos', 'Lopez', NULL, NULL, '1122334403', NULL, '1993-01-15', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Departamento', 0, 'Primeriza', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(5, 'laura.gonzalez4@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Laura', 'Gonzalez', NULL, NULL, '1122334404', NULL, '1994-01-15', 'Femenino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Casa con patio', 0, 'Intermedia', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(6, 'pedro.perez5@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Pedro', 'Perez', NULL, NULL, '1122334405', NULL, '1995-01-15', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Departamento', 0, 'Avanzada', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(7, 'sofia.sanchez6@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Sofia', 'Sanchez', NULL, NULL, '1122334406', NULL, '1996-01-15', 'Femenino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Casa con patio', 0, 'Primeriza', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(8, 'luis.romero7@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Luis', 'Romero', NULL, NULL, '1122334407', NULL, '1997-01-15', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Departamento', 0, 'Intermedia', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(9, 'marco@ong2.org', '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'ong', 2, 'Marco', 'Polo', NULL, NULL, '1122334408', NULL, '1998-01-15', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Casa con patio', 0, 'Avanzada', NULL, NULL, NULL, NULL, '2025-10-29 02:29:35', '2025-10-20 02:10:52', 0, NULL),
(10, 'javier@ong1.org', '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'ong', 1, 'Javier', 'Diaz', NULL, NULL, '1122334409', NULL, '1999-01-15', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'Departamento', 0, 'Primeriza', NULL, NULL, NULL, NULL, '2025-10-22 22:30:02', '2025-10-20 02:10:52', 0, NULL),
(11, 'sbujan@gmail.com', '8146cedca9d6bfb47b77f581973da5a0bee365aa9ec9ebb5b12d142fca2c3cc1', 'usuario', NULL, 'Sergio Ezequiel', 'Bujan', 0, '29364773', '1136250164', NULL, '1982-03-20', 'Masculino', NULL, NULL, NULL, NULL, NULL, 0, NULL, 'con patio', 0, 'amplia', 2, 2, 3, 3, '2025-10-25 21:09:45', '2025-10-22 02:46:37', 0, NULL),
(12, 'jhon@house.com', 'b391fa64cb3fcb7c64b02a528c2d0514ba9c93fc1611b557ede0b91ef88ec9ae', 'usuario', NULL, 'Jhonny', 'Dubai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2025-10-28 22:59:37', '2025-10-25 18:53:08', 0, 'a90979d90f1d313e400fe05315d520fac72e007bd70454a2d83599a8a9373a99'),
(13, 'maria@house.com.ar', '626e3c805e77eeb472c42c6be607be2af7ac5c08fd7050f278e0330fe81abf57', 'usuario', NULL, 'mariapepa', 'Sil', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2025-10-30 20:03:50', '2025-10-30 20:03:50', 1, '4fb2be2cfa8855179396c22905d370a931627ed1752c5140c814bf9fa3fd24ce');

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
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `adopciones`
--
ALTER TABLE `adopciones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `ImagenesMascota`
--
ALTER TABLE `ImagenesMascota`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mascotas`
--
ALTER TABLE `mascotas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `ONGs`
--
ALTER TABLE `ONGs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

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
-- Constraints for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`ong_id`) REFERENCES `ONGs` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
