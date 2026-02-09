<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

require "../../config/database.php";
require "../models/NoticiaModel.php";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function json_exit($arr) {
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

$model = new NoticiaModel($conexion);

/* ✅ IMPORTANTE: leer accion de GET o POST */
$accion = $_GET['accion'] ?? $_POST['accion'] ?? '';

/* ======================
   LISTAR (público)
====================== */
if ($accion === 'listar') {
    json_exit([
        'ok' => true,
        'noticias' => $model->listar()
    ]);
}

/* ======================
   SOLO ORGANIZADOR
====================== */
if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
    json_exit(['ok'=>false,'error'=>'No autorizado']);
}

/* ======================
   CREAR
====================== */
if ($accion === 'crear') {
    $titulo = trim($_POST['titulo'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');

    if ($titulo === '' || $descripcion === '') {
        json_exit(['ok'=>false,'error'=>'Título y descripción son obligatorios']);
    }

    $model->crear(['titulo'=>$titulo, 'descripcion'=>$descripcion]);
    json_exit(['ok'=>true]);
}

/* ======================
   EDITAR
====================== */
if ($accion === 'editar') {
    $id = intval($_POST['id'] ?? 0);
    $titulo = trim($_POST['titulo'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');

    if (!$id) json_exit(['ok'=>false,'error'=>'ID inválido']);
    if ($titulo === '' || $descripcion === '') {
        json_exit(['ok'=>false,'error'=>'Título y descripción son obligatorios']);
    }

    $model->editar($id, ['titulo'=>$titulo, 'descripcion'=>$descripcion]);
    json_exit(['ok'=>true]);
}

/* ======================
   BORRAR
====================== */
if ($accion === 'borrar') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) json_exit(['ok'=>false,'error'=>'ID inválido']);

    $model->borrar($id);
    json_exit(['ok'=>true]);
}

json_exit(['ok'=>false,'error'=>'Acción inválida']);
