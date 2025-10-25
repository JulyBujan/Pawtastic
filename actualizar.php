<?php
// --- MEDIDA DE SEGURIDAD ---
// Cambia 'TU_TOKEN_SECRETO' por una cadena de caracteres larga y aleatoria.
$secret_token = $_ENV["JWT_KEY"];

// Verifica que el token proporcionado en la URL sea correcto.
if (!isset($_GET['token']) || $_GET['token'] !== $secret_token) {
    header('HTTP/1.0 403 Forbidden');
    die('Acceso denegado. Token inválido.');
}

// --- EJECUCIÓN DEL COMANDO ---
$command = 'git pull';

// Prepara la salida como texto plano para que sea legible.
header('Content-Type: text/plain; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Actualización desde Git</title>
    <style>
        body {
            font-family: monospace;
            background-color: #1e1e1e;
            color: #d4d4d4;
            padding: 15px;
        }
    </style>
</head>
<body>
<pre>
<?php
echo "--- Ejecutando: $command ---\\n\\n";

// Ejecuta el comando y muestra la salida en tiempo real.
// El '2>&1' redirige la salida de error a la salida estándar para que también se muestre.
passthru($command . ' 2>&1', $return_code);

echo "\\n--- Proceso finalizado con código de salida: $return_code ---\\n";
?>
</pre>
</body>
</html>
