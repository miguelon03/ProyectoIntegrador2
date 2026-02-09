<?php
session_start();
header("Content-Type: application/json");

require "../../config/database.php";

/* SOLO ORGANIZADOR */
if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
    echo json_encode(['ok'=>false,'error'=>'No autorizado']);
    exit;
}

$accion = $_GET['accion'] ?? '';

/* =========================
   GUARDAR EDICIÓN
========================= */
if ($accion === 'guardar') {

    // Obtener datos actuales de gala
    $gala = $conexion->query("
        SELECT texto_resumen, fecha_edicion
        FROM gala WHERE id = 1
    ")->fetch_assoc();

    if (!$gala['texto_resumen']) {
        echo json_encode(['ok'=>false,'error'=>'No hay resumen']);
        exit;
    }

    // Insertar edición
    $stmt = $conexion->prepare("
        INSERT INTO ediciones (fecha, texto_resumen)
        VALUES (CURDATE(), ?)
    ");
    $stmt->bind_param("s", $gala['texto_resumen']);
    $stmt->execute();

    $id_edicion = $conexion->insert_id;

    // Copiar imágenes
    $imgs = $conexion->query("SELECT ruta FROM gala_imagenes");
    while ($img = $imgs->fetch_assoc()) {
        $stmt = $conexion->prepare("
            INSERT INTO ediciones_imagenes (id_edicion, ruta)
            VALUES (?,?)
        ");
        $stmt->bind_param("is", $id_edicion, $img['ruta']);
        $stmt->execute();
    }

    // Limpiar gala actual
    $conexion->query("UPDATE gala SET texto_resumen = NULL");
    $conexion->query("DELETE FROM gala_imagenes");
    $conexion->query("UPDATE gala SET modo = 'PRE'");

    echo json_encode(['ok'=>true]);
    exit;
}

echo json_encode(['ok'=>false,'error'=>'Acción no válida']);
