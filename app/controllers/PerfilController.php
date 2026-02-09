<?php
error_reporting(0);
ini_set('display_errors', 0);

session_start();
header("Content-Type: application/json");

require "../../config/database.php";

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(['ok' => false, 'error' => 'No autorizado']);
    exit;
}

$id = intval($_SESSION['id_usuario']);

$datos = $conexion->query("
    SELECT 
        p.usuario,
        i.email,
        i.dni,
        i.expediente,
        i.estado,
        i.video,
        i.motivo_rechazo,
        i.id_inscripcion
    FROM participantes p
    LEFT JOIN inscripciones i ON i.id_usuario = p.id_usuario
    WHERE p.id_usuario = $id
")->fetch_assoc();

$candidaturas = [];

if (!empty($datos['id_inscripcion'])) {
    $candidaturas[] = [
        'estado' => $datos['estado'],
        'video' => $datos['video'],
        'motivo_rechazo' => $datos['motivo_rechazo']
    ];
}

echo json_encode([
    'ok' => true,
    'usuario' => $datos['usuario'],
    'email' => $datos['email'],
    'dni' => $datos['dni'],
    'expediente' => $datos['expediente'],
    'candidaturas' => $candidaturas
]);
