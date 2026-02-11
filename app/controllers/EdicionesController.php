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

    // Registra los datos recibidos
    error_log("Datos recibidos: " . print_r($_POST, true)); // Muestra los datos recibidos en POST
    error_log("Archivos recibidos: " . print_r($_FILES, true)); // Muestra los archivos recibidos en FILES

    // Obtener datos actuales de gala
    $gala = $conexion->query("
        SELECT texto_resumen, fecha_edicion, modo
        FROM gala WHERE id = 1
    ")->fetch_assoc();

    $modo = $gala['modo'] ?? '';
    $textoResumen = $gala['texto_resumen'] ?? '';
    $fechaEdicion = $gala['fecha_edicion'] ?? null;

    if ($modo !== 'POST') {
        echo json_encode(['ok'=>false,'error'=>'La gala debe estar en modo POST para guardar una edición']);
        exit;
    }

    if (!$textoResumen) {
        echo json_encode(['ok'=>false,'error'=>'No hay resumen']);
        exit;
    }

    // Fecha: preferimos la fecha de la gala si existe
    $fecha = $fechaEdicion ?: date('Y-m-d');

    // Año: lo podemos recibir del formulario (modal) y si no, lo derivamos de la fecha
    $anio = isset($_POST['anio']) ? intval($_POST['anio']) : intval(date('Y', strtotime($fecha)));
    if ($anio <= 0) {
        $anio = intval(date('Y', strtotime($fecha)));
    }

    // Validar imágenes (debe haber al menos 1) antes de guardar la edición
    $imgsRes = $conexion->query("SELECT ruta FROM gala_imagenes");
    if (!$imgsRes || $imgsRes->num_rows === 0) {
        echo json_encode(['ok'=>false,'error'=>'No hay imágenes en la galería de la post-gala']);
        exit;
    }
    $imgs = $imgsRes->fetch_all(MYSQLI_ASSOC);

    // Insertar edición
    $stmt = $conexion->prepare("
        INSERT INTO ediciones (anio, fecha, texto_resumen)
        VALUES (?,?,?)
    ");

    if (!$stmt) {
        echo json_encode(['ok'=>false,'error'=>'Error preparando inserción de edición']);
        exit;
    }

    $stmt->bind_param("iss", $anio, $fecha, $textoResumen);
    $stmt->execute();
    $id_edicion = $conexion->insert_id;

    // Copiar imágenes
    foreach ($imgs as $img) {
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
