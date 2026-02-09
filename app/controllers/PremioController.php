<?php
session_start();
header("Content-Type: application/json");
require "../../config/database.php";

/* SOLO ORGANIZADOR */
if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
    echo json_encode(['ok'=>false,'error'=>'No autorizado']);
    exit;
}

$accion = $_GET['accion'] ?? $_POST['accion'] ?? null;

/* =======================
   CREAR PREMIO
======================= */
if ($accion === 'crear') {

    $stmt = $conexion->prepare("
        INSERT INTO premios (nombre, descripcion)
        VALUES (?,?)
    ");
    $stmt->bind_param("ss", $_POST['nombre'], $_POST['descripcion']);
    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}

/* =======================
   LISTAR PREMIOS
======================= */
if ($accion === 'listar') {

    $res = $conexion->query("SELECT * FROM premios");

    echo json_encode([
        'ok'=>true,
        'premios'=>$res->fetch_all(MYSQLI_ASSOC)
    ]);
    exit;
}

/* =======================
   LISTAR CANDIDATURAS NOMINADAS
======================= */
if ($accion === 'nominadas') {

    $res = $conexion->query("
        SELECT id_inscripcion, usuario
        FROM inscripciones i
        JOIN participantes p ON p.id_usuario = i.id_usuario
        WHERE estado = 'NOMINADO'
    ");

    echo json_encode([
        'ok'=>true,
        'nominadas'=>$res->fetch_all(MYSQLI_ASSOC)
    ]);
    exit;
}

/* =======================
   ASIGNAR PREMIO
======================= */
if ($accion === 'asignar') {

    $stmt = $conexion->prepare("
        INSERT INTO premios_ganadores (id_premio, id_inscripcion)
        VALUES (?,?)
    ");
    $stmt->bind_param("ii", $_POST['premio'], $_POST['inscripcion']);
    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}

echo json_encode(['ok'=>false,'error'=>'Acción inválida']);
