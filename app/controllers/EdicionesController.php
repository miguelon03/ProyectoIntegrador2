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

    // Logs de depuración
    error_log("POST recibido en guardar edición: " . print_r($_POST, true));
    error_log("FILES recibido en guardar edición: " . print_r($_FILES, true));

    /* =========================
       VALIDAR AÑO
    ========================== */
    $anio = intval($_POST['anio'] ?? 0);

    if ($anio < 1900 || $anio > intval(date("Y"))) {
        echo json_encode(['ok'=>false,'error'=>'Año inválido']);
        exit;
    }

    /* =========================
       OBTENER DATOS DE LA GALA
    ========================== */
    $gala = $conexion->query("
        SELECT texto_resumen, fecha_edicion, modo
        FROM gala
        WHERE id = 1
    ")->fetch_assoc();

    if (!$gala) {
        echo json_encode(['ok'=>false,'error'=>'No se pudo leer la gala']);
        exit;
    }

    $modo = $gala['modo'] ?? '';
    $textoResumen = trim($gala['texto_resumen'] ?? '');
    $fechaEdicion = $gala['fecha_edicion'] ?? null;

    if ($modo !== 'POST') {
        echo json_encode(['ok'=>false,'error'=>'La gala debe estar en modo POST para guardar una edición']);
        exit;
    }

    if ($textoResumen === '') {
        echo json_encode(['ok'=>false,'error'=>'No hay resumen para guardar']);
        exit;
    }

    if (!$fechaEdicion || !strtotime($fechaEdicion)) {
        echo json_encode(['ok'=>false,'error'=>'La gala no tiene fecha válida']);
        exit;
    }

    /* =========================
       VALIDAR IMÁGENES EXISTENTES
    ========================== */
    $imgsRes = $conexion->query("SELECT ruta FROM gala_imagenes");

    if (!$imgsRes || $imgsRes->num_rows === 0) {
        echo json_encode(['ok'=>false,'error'=>'No hay imágenes en la galería de la post-gala']);
        exit;
    }

    $imgs = $imgsRes->fetch_all(MYSQLI_ASSOC);

    /* =========================
       INSERTAR EDICIÓN
    ========================== */
    $stmt = $conexion->prepare("
        INSERT INTO ediciones (anio, fecha, texto_resumen)
        VALUES (?,?,?)
    ");

    if (!$stmt) {
        echo json_encode(['ok'=>false,'error'=>'Error preparando inserción de edición']);
        exit;
    }

    $stmt->bind_param("iss", $anio, $fechaEdicion, $textoResumen);
    $stmt->execute();
    $id_edicion = $conexion->insert_id;

    if (!$id_edicion) {
        echo json_encode(['ok'=>false,'error'=>'No se pudo crear la edición']);
        exit;
    }

    /* =========================
       COPIAR IMÁGENES A LA EDICIÓN
    ========================== */
    foreach ($imgs as $img) {
        $stmt = $conexion->prepare("
            INSERT INTO ediciones_imagenes (id_edicion, ruta)
            VALUES (?,?)
        ");
        $stmt->bind_param("is", $id_edicion, $img['ruta']);
        $stmt->execute();
    }

    /* =========================
       LIMPIAR GALA ACTUAL
    ========================== */
    $conexion->query("UPDATE gala SET texto_resumen = NULL");
    $conexion->query("DELETE FROM gala_imagenes");
    $conexion->query("UPDATE gala SET modo = 'PRE'");

    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   ACCIÓN NO VÁLIDA
========================= */
echo json_encode(['ok'=>false,'error'=>'Acción no válida']);
