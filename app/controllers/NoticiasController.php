<?php
session_start();
error_log(print_r($_SESSION, true));

header('Content-Type: application/json');

require "../../config/database.php";
require "../models/NoticiaModel.php";

$model = new NoticiaModel($conexion);
$accion = $_GET['accion'] ?? '';

/* ======================
   LISTAR (público)
====================== */
if ($accion === 'listar') {
    echo json_encode([
        'ok' => true,
        'noticias' => $model->listar()
    ]);
    exit;
}

/* ======================
   SOLO ORGANIZADOR
====================== */
if (!isset($_SESSION['tipo']) ) {
    echo json_encode(['ok'=>false,'error'=>'No autorizado']);
    exit;
}

/* ======================
   CREAR
====================== */
if ($accion === 'crear') {
    $model->crear($_POST);
    echo json_encode(['ok'=>true]);
    exit;
}

/* ======================
   EDITAR
====================== */
if ($accion === 'editar') {
    $model->editar($_POST['id'], $_POST);
    echo json_encode(['ok'=>true]);
    exit;
}

/* ======================
   BORRAR
====================== */
if ($accion === 'borrar') {
    $model->borrar($_GET['id']);
    echo json_encode(['ok'=>true]);
    exit;
}

echo json_encode(['ok'=>false,'error'=>'Acción inválida']);
