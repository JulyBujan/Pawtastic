-- Pawtastic | Modulo Mascotas Perdidas/Encontradas

CREATE TABLE IF NOT EXISTS `lost_found_posts` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lost_found_type_status` (`type`,`status`),
  KEY `idx_lost_found_species` (`species`),
  KEY `idx_lost_found_date_seen` (`date_seen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lost_found_posts'
    AND COLUMN_NAME = 'suburb'
);
SET @sql_stmt := IF(
  @col_exists = 0,
  'ALTER TABLE lost_found_posts ADD COLUMN suburb varchar(80) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lost_found_posts'
    AND COLUMN_NAME = 'deleted_at'
);
SET @sql_stmt := IF(
  @col_exists = 0,
  'ALTER TABLE lost_found_posts ADD COLUMN deleted_at datetime DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lost_found_posts'
    AND COLUMN_NAME = 'lat'
);
SET @sql_stmt := IF(
  @col_exists = 0,
  'ALTER TABLE lost_found_posts ADD COLUMN lat float DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lost_found_posts'
    AND COLUMN_NAME = 'lon'
);
SET @sql_stmt := IF(
  @col_exists = 0,
  'ALTER TABLE lost_found_posts ADD COLUMN lon float DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Datos de ejemplo (opcional)
INSERT IGNORE INTO `lost_found_posts` (`id`, `type`, `user_id`, `pet_name`, `species`, `breed`, `colors`, `size`, `location_text`, `suburb`, `lat`, `lon`, `date_seen`, `description`, `photo_url`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(2, 'FOUND', 8, NULL, 'Perro', 'Mestizo', 'negro, blanco', 'medium', 'Bv. Los Granaderos, Córdoba', 'Los Granaderos', -31.387, -64.135, '2026-01-30', 'Encontrado cerca de una plaza.', 'img/mascotas/default.jpg', 'OPEN', '2026-01-30 11:12:00', '2026-01-30 11:12:00', NULL),
(4, 'FOUND', 2, NULL, 'Gato', 'Siames', 'crema', 'small', 'Alta Córdoba', 'Alta Córdoba', -31.403, -64.184, '2026-01-26', 'Apareció en el patio del edificio.', 'img/mascotas/default.jpg', 'OPEN', '2026-01-26 14:05:00', '2026-01-26 14:05:00', NULL),
(6, 'FOUND', 7, NULL, 'Perro', 'Labrador', 'marron, blanco', 'large', 'Cerro de las rosas', 'Cerro de las rosas', -31.373, -64.255, '2026-02-02', 'Se acercó a la puerta del refugio.', 'img/mascotas/default.jpg', 'OPEN', '2026-02-02 08:45:00', '2026-02-02 08:45:00', NULL);

CREATE TABLE IF NOT EXISTS `lost_found_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `recipient_id` int NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lost_found_msg_post` (`post_id`),
  KEY `idx_lost_found_msg_sender` (`sender_id`),
  KEY `idx_lost_found_msg_recipient` (`recipient_id`),
  KEY `idx_lost_found_msg_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de ejemplo (opcional)

SET @fk_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lost_found_messages'
    AND CONSTRAINT_NAME = 'lost_found_messages_ibfk_1'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_stmt := IF(
  @fk_exists = 0,
  'ALTER TABLE lost_found_messages ADD CONSTRAINT lost_found_messages_ibfk_1 FOREIGN KEY (post_id) REFERENCES lost_found_posts (id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lost_found_messages'
    AND CONSTRAINT_NAME = 'lost_found_messages_ibfk_2'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_stmt := IF(
  @fk_exists = 0,
  'ALTER TABLE lost_found_messages ADD CONSTRAINT lost_found_messages_ibfk_2 FOREIGN KEY (sender_id) REFERENCES usuarios (id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lost_found_messages'
    AND CONSTRAINT_NAME = 'lost_found_messages_ibfk_3'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_stmt := IF(
  @fk_exists = 0,
  'ALTER TABLE lost_found_messages ADD CONSTRAINT lost_found_messages_ibfk_3 FOREIGN KEY (recipient_id) REFERENCES usuarios (id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
