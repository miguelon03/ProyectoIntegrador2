<?php
session_start();
header("Content-Type: application/json");

echo json_encode([
    'logeado' => isset($_SESSION['id_usuario']),
    'usuario' => $_SESSION['usuario'] ?? null
]);
