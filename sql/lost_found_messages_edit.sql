-- Pawtastic | Agregar edited_at a lost_found_messages (idempotente)

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lost_found_messages'
    AND COLUMN_NAME = 'edited_at'
);
SET @sql_stmt := IF(
  @col_exists = 0,
  'ALTER TABLE lost_found_messages ADD COLUMN edited_at datetime DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
