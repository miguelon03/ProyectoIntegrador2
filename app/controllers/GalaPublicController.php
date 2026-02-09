<?php
header("Content-Type: application/json; charset=UTF-8");
require "../../config/database.php";

/* =========================
   DATOS DE LA GALA
========================= */
$res = $conexion->query("
    SELECT modo, texto_resumen, fecha_edicion
    FROM gala
    WHERE id = 1
");

$gala = $res->fetch_assoc();

if (!$gala) {
    echo json_encode(['ok' => false]);
    exit;
}

/* =========================
   PRE-GALA
========================= */
$secciones = [];

if ($gala['modo'] === 'PRE') {
    $r = $conexion->query("
        SELECT titulo, hora, sala, descripcion
        FROM gala_secciones
        ORDER BY hora
    ");
    $secciones = $r->fetch_all(MYSQLI_ASSOC);
}

/* =========================
   POST-GALA
========================= */
$imagenes = [];

if ($gala['modo'] === 'POST') {
    $r = $conexion->query("
        SELECT ruta
        FROM gala_imagenes
    ");
    $imagenes = $r->fetch_all(MYSQLI_ASSOC);
}

/* =========================
   RESPUESTA
========================= */
echo json_encode([
    'ok' => true,
    'modo' => $gala['modo'],
    'fecha' => $gala['fecha_edicion'],
    'texto' => $gala['texto_resumen'],
    'secciones' => $secciones,
    'imagenes' => $imagenes
]);
