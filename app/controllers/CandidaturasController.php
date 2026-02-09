<?php
session_start();
header("Content-Type: application/json");
require "../../config/database.php";

$accion = $_GET['accion'] ?? '';
if ($accion === 'nominados') {

    $res = $conexion->query("
        SELECT id_inscripcion, nombre_responsable
        FROM inscripciones
        WHERE estado='NOMINADO'
    ");

    echo json_encode([
        'ok'=>true,
        'nominados'=>$res->fetch_all(MYSQLI_ASSOC)
    ]);
    exit;
}
