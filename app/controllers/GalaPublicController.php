<?php
header("Content-Type: application/json");
require "../../config/database.php";

/* =========================
   ESTADO GALA
========================= */
$res = $conexion->query("SELECT modo, texto_resumen FROM gala WHERE id = 1");
$gala = $res->fetch_assoc();

/* =========================
   SECCIONES
========================= */
$secciones = [];
if ($gala['modo'] === 'PRE') {
    $r = $conexion->query(
        "SELECT * FROM gala_secciones ORDER BY hora"
    );
    $secciones = $r->fetch_all(MYSQLI_ASSOC);
}

/* =========================
   IMÁGENES
========================= */
$imagenes = [];
if ($gala['modo'] === 'POST') {
    $r = $conexion->query("SELECT * FROM gala_imagenes");
    $imagenes = $r->fetch_all(MYSQLI_ASSOC);
}

echo json_encode([
    'ok' => true,
    'modo' => $gala['modo'],
    'texto' => $gala['texto_resumen'],
    'secciones' => $secciones,
    'imagenes' => $imagenes
]);
