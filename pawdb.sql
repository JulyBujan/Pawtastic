-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS `dbpawtastic` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos recién creada
USE `dbpawtastic`;

-- --------------------------------------------------------

--
-- Estructura de la tabla `usuarios`
-- Guarda tanto a usuarios comunes como a las ONGs.
--

CREATE TABLE `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(64) NOT NULL COMMENT 'Almacena el hash SHA-256 de la contraseña',
  `tipo` ENUM('usuario', 'ong') NOT NULL,
  ong_id INT(11) DEFAULT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(50) DEFAULT NULL,
  foto_perfil_url VARCHAR(255),
  direccion VARCHAR(255),
  fecha_nacimiento DATE,
  sexo ENUM('Masculino', 'Femenino', 'Otro'),

  -- Merged profile fields
  tipo_casa VARCHAR(100),
  tipo_familia VARCHAR(100),
  otras_mascotas TEXT,
  experiencia TEXT,

  -- Merged personality fields
  nivel_energia VARCHAR(50),
  sociabilidad VARCHAR(100),
  presencia VARCHAR(100),
  estilo_vida VARCHAR(50) COMMENT 'Ej: Outdoor/Indoor',

  -- Timestamps
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_registro` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unico` (`email`),
  FOREIGN KEY (ong_id) REFERENCES ONGs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabla: ONGs
-- Stores information about partner organizations (shelters, rescues).
CREATE TABLE ONGs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  razon_social VARCHAR(255),
  cuit VARCHAR(13) UNIQUE,
  direccion VARCHAR(255),
  responsable_id INT,
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- Estructura de la tabla `mascotas`
-- Almacena la información de las mascotas publicadas por las ONGs.
--

CREATE TABLE `mascotas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `id_ong` INT(11) NOT NULL,
  `ong_email` VARCHAR(100) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `tipo` VARCHAR(50) NOT NULL,
  `edad` VARCHAR(50) NOT NULL,
  `sexo` VARCHAR(50) NOT NULL,
  `tamaño` VARCHAR(50) NOT NULL,
  `vacunado` VARCHAR(50) NOT NULL,
  `esterilizado` VARCHAR(50) NOT NULL,
  `chip` VARCHAR(50) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `imagen` VARCHAR(255) DEFAULT NULL,
  `energia` ENUM('Alto', 'Medio', 'Bajo') DEFAULT NULL,
  `sociabilidad` ENUM('Muy sociable', 'Selectivo', 'Reservado') DEFAULT NULL,
  `presencia` ENUM('Necesita compañía constante', 'Tolera estar solo', 'Independiente') DEFAULT NULL,
  `estilo` ENUM('Outdoor', 'Indoor', 'Flexible') DEFAULT NULL,
  `fecha_publicacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mascota_ong` (`id_ong`),
  CONSTRAINT `fk_mascota_ong` FOREIGN KEY (`id_ong`) REFERENCES `ONGs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: ImagenesMascota
-- Stores multiple image URLs for each pet.
-- -----------------------------------------------------
CREATE TABLE ImagenesMascota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  url_imagen VARCHAR(255) NOT NULL,
  descripcion VARCHAR(255),
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE
);

