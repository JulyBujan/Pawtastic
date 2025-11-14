-- SQL para agregar la columna fecha_fin y actualizar los registros existentes.
-- Generado en base a tesis.sql

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- 1. Agregar la columna `fecha_fin` a la tabla `adopciones` si no existe.
-- Esta columna almacenará la fecha en que una solicitud de adopción se finaliza (aprueba o rechaza).
--

ALTER TABLE `adopciones` MODIFY COLUMN `fecha_fin` TIMESTAMP NULL DEFAULT NULL AFTER `fecha_inicio`;

--
-- 2. Actualizar las adopciones existentes que ya están finalizadas (estado != 0).
-- Se establece una `fecha_fin` coherente, posterior a la `fecha_inicio`.
-- Las fechas se distribuyen en los últimos 90 días.
--

UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 5 DAY) WHERE `id` = 12;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 46 DAY) WHERE `id` = 13;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 7 DAY) WHERE `id` = 14;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 8 DAY) WHERE `id` = 15;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 10 DAY) WHERE `id` = 16;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 12 DAY) WHERE `id` = 17;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 13 DAY) WHERE `id` = 18;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 14 DAY) WHERE `id` = 19;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 16 DAY) WHERE `id` = 20;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 5 DAY) WHERE `id` = 21;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 45 DAY) WHERE `id` = 22;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 36 DAY) WHERE `id` = 23;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 7 DAY) WHERE `id` = 24;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 8 DAY) WHERE `id` = 25;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 10 DAY) WHERE `id` = 26;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 12 DAY) WHERE `id` = 27;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 26 DAY) WHERE `id` = 28;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 4 DAY) WHERE `id` = 29;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 5 DAY) WHERE `id` = 30;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 15 DAY) WHERE `id` = 31;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 6 DAY) WHERE `id` = 32;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 17 DAY) WHERE `id` = 33;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 7 DAY) WHERE `id` = 34;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 35 DAY) WHERE `id` = 35;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 7 DAY) WHERE `id` = 36;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 15 DAY) WHERE `id` = 37;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 5 DAY) WHERE `id` = 38;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 26 DAY) WHERE `id` = 39;
UPDATE `adopciones` SET `fecha_fin` = DATE_ADD(`fecha_inicio`, INTERVAL 5 DAY) WHERE `id` = 40;

COMMIT;