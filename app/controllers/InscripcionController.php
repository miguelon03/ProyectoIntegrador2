<?php
session_start();
header("Content-Type: application/json");
require "../../config/database.php";

/* =========================
   ACCIÓN (si existe)
========================= */
$accion = $_GET['accion'] ?? $_POST['accion'] ?? null;

/* =========================
   LISTAR CANDIDATURAS (ORGANIZADOR)
========================= */
if ($accion === 'listar') {

    if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
        echo json_encode(['ok'=>false,'error'=>'No autorizado']);
        exit;
    }

    $res = $conexion->query("
        SELECT i.*, p.usuario
        FROM inscripciones i
        JOIN participantes p ON p.id_usuario = i.id_usuario
        ORDER BY i.fecha DESC
    ");

    echo json_encode([
        'ok'=>true,
        'candidaturas'=>$res->fetch_all(MYSQLI_ASSOC)
    ]);
    exit;
}

/* =========================
   ACEPTAR
========================= */
if ($accion === 'aceptar') {

    if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
        echo json_encode(['ok'=>false,'error'=>'No autorizado']);
        exit;
    }

    $id = intval($_GET['id']);
    $conexion->query("
        UPDATE inscripciones
        SET estado='ACEPTADO'
        WHERE id_inscripcion=$id
    ");

    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   NOMINAR
========================= */
if ($accion === 'nominar') {

    if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
        echo json_encode(['ok'=>false,'error'=>'No autorizado']);
        exit;
    }

    $id = intval($_GET['id']);
    $conexion->query("
        UPDATE inscripciones
        SET estado='NOMINADO'
        WHERE id_inscripcion=$id
    ");

    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   RECHAZAR
========================= */
if ($accion === 'rechazar') {

    if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
        echo json_encode(['ok'=>false,'error'=>'No autorizado']);
        exit;
    }

    $id = intval($_POST['id']);
    $motivo = $_POST['motivo'] ?? '';

    $stmt = $conexion->prepare("
        UPDATE inscripciones
        SET estado='RECHAZADO', motivo_rechazo=?
        WHERE id_inscripcion=?
    ");
    $stmt->bind_param("si", $motivo, $id);
    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   INSCRIPCIÓN (PARTICIPANTE)
========================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    /* === crear usuario si no hay sesión === */
    if (!isset($_SESSION['id_usuario'])) {

        if (empty($_POST['usuario']) || empty($_POST['contrasena'])) {
            echo json_encode(['ok'=>false,'error'=>'Usuario y contraseña obligatorios']);
            exit;
        }

        $hash = password_hash($_POST['contrasena'], PASSWORD_DEFAULT);

        $stmt = $conexion->prepare("
            INSERT INTO participantes (usuario, contrasena)
            VALUES (?,?)
        ");
        $stmt->bind_param("ss", $_POST['usuario'], $hash);
        $stmt->execute();

        $_SESSION['id_usuario'] = $conexion->insert_id;
        $_SESSION['usuario'] = $_POST['usuario'];
        $_SESSION['tipo'] = 'participante';
    }

    $id_usuario = $_SESSION['id_usuario'];

    /* === archivos (solo nombre, no movemos aún) === */
    $ficha  = $_FILES['ficha']['name']  ?? null;
    $cartel = $_FILES['cartel']['name'] ?? null;

    /* === insertar inscripción === */
    $stmt = $conexion->prepare("
        INSERT INTO inscripciones
        (id_usuario, ficha, cartel, sinopsis, nombre_responsable, email, dni, expediente, video)
        VALUES (?,?,?,?,?,?,?,?,?)
    ");

    $stmt->bind_param(
        "issssssss",
        $id_usuario,
        $ficha,
        $cartel,
        $_POST['sinopsis'],
        $_POST['usuario'],
        $_POST['email'],
        $_POST['dni'],
        $_POST['expediente'],
        $_POST['video']
    );

    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   FALLBACK
========================= */
echo json_encode(['ok'=>false,'error'=>'Petición inválida']);
