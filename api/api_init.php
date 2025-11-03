<?php
/**
 * Archivo de inicialización para todos los endpoints de la API.
 *
 * - Configura el manejo de errores para no corromper las respuestas JSON.
 * - Establece la cabecera Content-Type a application/json.
 * - Carga el autoloader de Composer.
 * - Establece la conexión con la base de datos.
 *
 * Al incluir este archivo, la variable $conn estará disponible.
 */

// 1. Manejador de errores global para respuestas JSON limpias.
require_once __DIR__ . '/error_handler.php';

// 2. Establecer la cabecera de respuesta estándar para la API.
header("Content-Type: application/json");

// 3. Cargar dependencias y conexión a la base de datos.
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/conexion.php'; // Esto define la variable $conn