<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

// Logueado si hay participante u organizador
$logeado = isset($_SESSION['id_usuario']) || isset($_SESSION['id_organizador']);

echo json_encode([
    'ok'      => true,
    'logeado' => $logeado,
    'tipo'    => $_SESSION['tipo'] ?? null,
    'usuario' => $_SESSION['usuario'] ?? null,
], JSON_UNESCAPED_UNICODE);
