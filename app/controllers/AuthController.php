<?php
session_start();
header('Content-Type: application/json');

require "../../config/database.php";

$usuario    = $_POST['usuario'] ?? '';
$contrasena = $_POST['contrasena'] ?? '';
$tipo       = $_POST['tipo'] ?? '';

$mapa = [
    'participante' => [
        'tabla' => 'participantes',
        'id'    => 'id_usuario',
        'panel' => '/ProyectoIntegrador2/public/html/index.html'
    ],
    'organizador' => [
        'tabla' => 'organizadores',
        'id'    => 'id_organizador',
        'panel' => '/ProyectoIntegrador2/public/html/panel_organizador.html'
    ]
];

if (!isset($mapa[$tipo])) {
    echo json_encode(['ok' => false, 'error' => 'Tipo no válido']);
    exit;
}

$tabla   = $mapa[$tipo]['tabla'];
$idCampo = $mapa[$tipo]['id'];
$panel   = $mapa[$tipo]['panel'];

$stmt = $conexion->prepare("
    SELECT $idCampo, contrasena
    FROM $tabla
    WHERE usuario = ?
");

$stmt->bind_param("s", $usuario);
$stmt->execute();
$res = $stmt->get_result();

if ($res && $res->num_rows === 1) {
    $row = $res->fetch_assoc();

    if (password_verify($contrasena, $row['contrasena'])) {

        $_SESSION['tipo']    = $tipo;
        $_SESSION['usuario'] = $usuario;
        $_SESSION[$idCampo]  = $row[$idCampo];

        echo json_encode([
            'ok' => true,
            'redirect' => $panel
        ]);
        exit;
    }
}

echo json_encode([
    'ok' => false,
    'error' => 'Usuario o contraseña incorrectos'
]);
