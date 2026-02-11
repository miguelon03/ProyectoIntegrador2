<?php
header("Content-Type: application/json");
require "../../config/database.php";

$res = $conexion->query("
    SELECT id, anio, texto_resumen, fecha
    FROM ediciones
    ORDER BY anio DESC, fecha DESC
");

$ediciones = [];

while ($e = $res->fetch_assoc()) {
    $imgs = $conexion->query("
        SELECT ruta FROM ediciones_imagenes
        WHERE id_edicion = {$e['id']}
    ")->fetch_all(MYSQLI_ASSOC);

    $e['imagenes'] = $imgs;
    $ediciones[] = $e;
}

echo json_encode([
    'ok'=>true,
    'ediciones'=>$ediciones
]);
