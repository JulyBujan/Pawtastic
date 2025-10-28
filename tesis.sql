-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Oct 26, 2025 at 02:09 PM
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
  `vacunado` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `esterilizado` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chip` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
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
(1, 1, 'Snoopy', 'perro', 5, 'Macho', 'Mediano', 'Sí', 'Sí', 'No', 'Beagle famoso por ser el perro de Charlie Brown.', NULL, 2, 3, 1, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(2, 1, 'Scooby-Doo', 'perro', 7, 'Macho', 'Grande', 'Sí', 'No', 'No', 'Gran Danés miedoso y glotón, resuelve misterios con sus amigos.', NULL, 1, 3, 3, 1, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(3, 1, 'Pluto', 'perro', 8, 'Macho', 'Mediano', 'Sí', 'Sí', 'No', 'El leal perro de Mickey Mouse, es juguetón y curioso.', NULL, 3, 3, 2, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(4, 2, 'Beethoven', 'perro', 4, 'Macho', 'Grande', 'Sí', 'No', 'Sí', 'Un San Bernardo gigante y travieso pero de buen corazón.', NULL, 2, 2, 3, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(5, 2, 'Toto', 'perro', 3, 'Macho', 'Pequeño', 'Sí', 'Sí', 'No', 'Pequeño Cairn terrier que acompañó a Dorothy en la tierra de Oz.', NULL, 3, 1, 2, 1, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(6, 2, 'Balto', 'perro', 6, 'Macho', 'Grande', 'Sí', 'Sí', 'Sí', 'Valiente perro de trineo que lideró una expedición para salvar a su pueblo en Alaska.', NULL, 3, 3, 1, 3, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(7, 3, 'Lassie', 'perro', 5, 'Hembra', 'Grande', 'Sí', 'Sí', 'No', 'Una Collie hermosa e inteligente, famosa por rescatar gente.', NULL, 2, 3, 3, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(8, 3, 'Marley', 'perro', 2, 'Macho', 'Grande', 'Sí', 'No', 'Sí', 'Un Labrador retriever adorable pero muy destructivo, protagonista de \"Marley y yo\".', NULL, 3, 3, 3, 3, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(9, 3, 'Milú', 'perro', 4, 'Macho', 'Pequeño', 'Sí', 'Sí', 'No', 'El inseparable Fox terrier blanco de Tintín, aventurero y leal.', NULL, 2, 2, 1, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(10, 1, 'Golfo', 'perro', 6, 'Macho', 'Mediano', 'No', 'No', 'No', 'Perro callejero, encantador y astuto de \"La Dama y el Vagabundo\".', NULL, 2, 3, 1, 3, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34'),
(11, 2, 'Benji', 'perro', 5, 'Macho', 'Pequeño', 'Sí', 'Sí', 'No', 'Un perro mestizo muy inteligente y heroico que siempre está en el lugar correcto para ayudar.', NULL, 2, 2, 1, 2, 0, '2025-10-21 02:45:45', '2025-10-20 02:17:34');

-- --------------------------------------------------------

--
-- Table structure for table `ONGs`
--

CREATE TABLE `ONGs` (
  `id` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `razon_social` varchar(255) DEFAULT NULL,
  `cuit` varchar(13) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `ultima_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ONGs`
--

INSERT INTO `ONGs` (`id`, `nombre`, `razon_social`, `cuit`, `direccion`, `ultima_actualizacion`) VALUES
(1, 'Patitas Felices', 'Patitas Felices S.A.', '30-12345678-1', 'Avenida Siempreviva 742', '2025-10-20 02:17:34'),
(2, 'Amigos de 4 Patas', 'Amigos de 4 Patas SRL', '30-87654321-2', 'Calle Falsa 123', '2025-10-20 02:17:34'),
(3, 'Rescate Animal', 'Fundación Rescate Animal', '30-11223344-3', 'Elm Street 1428', '2025-10-20 02:17:34');

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Almacena el hash SHA-256 de la contraseña',
  `tipo` enum('usuario','ong') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ong_id` int DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_documento` tinyint DEFAULT NULL,
  `documento` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_perfil_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` enum('Masculino','Femenino','Otro') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_casa` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_familia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otras_mascotas` text COLLATE utf8mb4_unicode_ci,
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

INSERT INTO `usuarios` (`id`, `email`, `password`, `tipo`, `ong_id`, `nombre`, `apellido`, `tipo_documento`, `documento`, `telefono`, `foto_perfil_url`, `direccion`, `fecha_nacimiento`, `sexo`, `tipo_casa`, `tipo_familia`, `otras_mascotas`, `experiencia`, `energia`, `sociabilidad`, `presencia`, `estilov`, `ultima_actualizacion`, `fecha_registro`, `estado`, `tokenv`) VALUES
(1, 'ana.garcia0@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Ana', 'García', NULL, NULL, '1122334400', NULL, 'Calle Falsa 123, Ciudad0', '1990-01-15', 'Femenino', 'Casa con patio', 'Soltero/a', 'No', 'Primeriza', NULL, NULL, NULL, NULL, '2025-10-20 02:10:51', '2025-10-20 02:10:51', 0, NULL),
(2, 'juan.rodriguez1@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Juan', 'Rodriguez', NULL, NULL, '1122334401', NULL, 'Calle Falsa 123, Ciudad1', '1991-01-15', 'Masculino', 'Departamento', 'Pareja sin hijos', 'Sí, un perro', 'Intermedia', NULL, NULL, NULL, NULL, '2025-10-20 02:10:51', '2025-10-20 02:10:51', 0, NULL),
(3, 'maria.martinez2@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Maria', 'Martinez', NULL, NULL, '1122334402', NULL, 'Calle Falsa 123, Ciudad2', '1992-01-15', 'Femenino', 'Casa con patio', 'Familia con niños', 'Sí, un gato', 'Avanzada', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(4, 'carlos.lopez3@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Carlos', 'Lopez', NULL, NULL, '1122334403', NULL, 'Calle Falsa 123, Ciudad3', '1993-01-15', 'Masculino', 'Departamento', 'Soltero/a', 'No', 'Primeriza', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(5, 'laura.gonzalez4@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Laura', 'Gonzalez', NULL, NULL, '1122334404', NULL, 'Calle Falsa 123, Ciudad4', '1994-01-15', 'Femenino', 'Casa con patio', 'Pareja sin hijos', 'Sí, un perro', 'Intermedia', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(6, 'pedro.perez5@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Pedro', 'Perez', NULL, NULL, '1122334405', NULL, 'Calle Falsa 123, Ciudad5', '1995-01-15', 'Masculino', 'Departamento', 'Familia con niños', 'Sí, un gato', 'Avanzada', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(7, 'sofia.sanchez6@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Sofia', 'Sanchez', NULL, NULL, '1122334406', NULL, 'Calle Falsa 123, Ciudad6', '1996-01-15', 'Femenino', 'Casa con patio', 'Soltero/a', 'No', 'Primeriza', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(8, 'luis.romero7@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', NULL, 'Luis', 'Romero', NULL, NULL, '1122334407', NULL, 'Calle Falsa 123, Ciudad7', '1997-01-15', 'Masculino', 'Departamento', 'Pareja sin hijos', 'Sí, un perro', 'Intermedia', NULL, NULL, NULL, NULL, '2025-10-20 02:10:52', '2025-10-20 02:10:52', 0, NULL),
(9, 'marco@ong2.org', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'usuario', 2, 'Marco', 'Polo', NULL, NULL, '1122334408', NULL, 'Calle Falsa 123, Ciudad8', '1998-01-15', 'Masculino', 'Casa con patio', 'Familia con niños', 'Sí, un gato', 'Avanzada', NULL, NULL, NULL, NULL, '2025-10-25 17:41:38', '2025-10-20 02:10:52', 0, NULL),
(10, 'javier@ong1.org', '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', 'ong', 1, 'Javier', 'Diaz', NULL, NULL, '1122334409', NULL, 'Calle Falsa 123, Ciudad9', '1999-01-15', 'Masculino', 'Departamento', 'Soltero/a', 'No', 'Primeriza', NULL, NULL, NULL, NULL, '2025-10-22 22:30:02', '2025-10-20 02:10:52', 0, NULL),
(11, 'sbujan@gmail.com', '8146cedca9d6bfb47b77f581973da5a0bee365aa9ec9ebb5b12d142fca2c3cc1', 'usuario', NULL, 'Sergio Ezequiel', 'Bujan', 0, '29364773', '1136250164', NULL, 'Juan Cruz Varela y Cordillera', '1982-03-20', 'Masculino', 'con patio', 'casado', 'si, tres y tres', 'amplia', 2, 2, 3, 3, '2025-10-25 21:09:45', '2025-10-22 02:46:37', 0, NULL),
(12, 'jhon@house.com', 'b391fa64cb3fcb7c64b02a528c2d0514ba9c93fc1611b557ede0b91ef88ec9ae', 'usuario', NULL, 'Jhonny', 'Dubai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-25 18:53:08', '2025-10-25 18:53:08', 1, 'a90979d90f1d313e400fe05315d520fac72e007bd70454a2d83599a8a9373a99');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ImagenesMascota`
--
ALTER TABLE `ImagenesMascota`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mascotas`
--
ALTER TABLE `mascotas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `ONGs`
--
ALTER TABLE `ONGs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

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


DELIMITER $$

CREATE PROCEDURE `calcular_compatibilidad_mascotas`(IN `id_usuario_in` INT)
BEGIN
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

DELIMITER ;
