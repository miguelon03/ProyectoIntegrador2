<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require "../../config/database.php";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function json_exit($arr) {
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

$accion = $_GET['accion'] ?? $_POST['accion'] ?? '';

/* =========================
   LISTAR (público + organizador)
========================= */
if ($accion === 'listar') {
    $res = $conexion->query("
        SELECT id_patrocinador, nombre, logo
        FROM patrocinadores
        ORDER BY fecha DESC
    ");
    json_exit(['ok'=>true,'patrocinadores'=>$res->fetch_all(MYSQLI_ASSOC)]);
}

/* =========================
   SOLO ORGANIZADOR
========================= */
if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
    json_exit(['ok'=>false,'error'=>'No autorizado']);
}

/* =========================
   CREAR
========================= */
if ($accion === 'crear') {

    $nombre = trim($_POST['nombre'] ?? '');

    if ($nombre === '') {
        json_exit(['ok'=>false,'error'=>'El nombre es obligatorio']);
    }

    if (empty($_FILES['logo']['name'])) {
        json_exit(['ok'=>false,'error'=>'El logo es obligatorio']);
    }

    /* 📁 carpeta uploads */
    $uploadsAbs = realpath(__DIR__ . "/../../") . "/uploads/";
    if (!is_dir($uploadsAbs)) {
        mkdir($uploadsAbs, 0777, true);
    }

    $fileName = uniqid("patro_") . "_" . basename($_FILES['logo']['name']);
    $destino = $uploadsAbs . $fileName;

    if (!move_uploaded_file($_FILES['logo']['tmp_name'], $destino)) {
        json_exit(['ok'=>false,'error'=>'Error al subir imagen']);
    }

    $rutaBD = "/ProyectoIntegrador2/uploads/" . $fileName;

    $stmt = $conexion->prepare("
        INSERT INTO patrocinadores (nombre, logo)
        VALUES (?,?)
    ");
    $stmt->bind_param("ss", $nombre, $rutaBD);
    $stmt->execute();

    json_exit(['ok'=>true]);
}

/* =========================
   ELIMINAR
========================= */
if ($accion === 'borrar') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) json_exit(['ok'=>false,'error'=>'ID inválido']);

    $stmt = $conexion->prepare("DELETE FROM patrocinadores WHERE id_patrocinador=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    json_exit(['ok'=>true]);
}

json_exit(['ok'=>false,'error'=>'Acción inválida']);
