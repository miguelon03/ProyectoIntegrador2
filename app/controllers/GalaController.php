<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require "../../config/database.php";

if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
    echo json_encode(['ok'=>false,'error'=>'No autorizado']);
    exit;
}

$accion = $_GET['accion'] ?? '';

/* =========================
   ESTADO GALA
========================= */
if ($accion === 'estado') {
    $res = $conexion->query("SELECT modo FROM gala WHERE id=1");
    echo json_encode(['ok'=>true,'modo'=>$res->fetch_assoc()['modo']]);
    exit;
}

/* =========================
   CAMBIAR MODO
========================= */
if ($accion === 'cambiarModo') {
    $modo = $conexion->query("SELECT modo FROM gala WHERE id=1")->fetch_assoc()['modo'];
    $nuevo = $modo === 'PRE' ? 'POST' : 'PRE';
    $stmt = $conexion->prepare("UPDATE gala SET modo=? WHERE id=1");
    $stmt->bind_param("s",$nuevo);
    $stmt->execute();
    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   SECCIONES PRE
========================= */
if ($accion === 'crearSeccion') {
    $stmt = $conexion->prepare("
        INSERT INTO gala_secciones (titulo, hora, sala, descripcion)
        VALUES (?,?,?,?)
    ");
    $stmt->bind_param("ssss",
        $_POST['titulo'],
        $_POST['hora'],
        $_POST['sala'],
        $_POST['descripcion']
    );
    $stmt->execute();
    echo json_encode(['ok'=>true]);
    exit;
}

if ($accion === 'listarSecciones') {
    $res = $conexion->query("SELECT * FROM gala_secciones ORDER BY hora");
    echo json_encode(['ok'=>true,'secciones'=>$res->fetch_all(MYSQLI_ASSOC)]);
    exit;
}

if ($accion === 'borrarSeccion') {
    $id = intval($_GET['id']);
    $stmt = $conexion->prepare("DELETE FROM gala_secciones WHERE id_seccion=?");
    $stmt->bind_param("i",$id);
    $stmt->execute();
    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   POST-GALA IMÁGENES
========================= */
if ($accion === 'subirImagen') {
    $dir = "../../uploads/";
    if (!is_dir($dir)) mkdir($dir,0777,true);

    $nombre = uniqid()."_".$_FILES['imagen']['name'];
    move_uploaded_file($_FILES['imagen']['tmp_name'],$dir.$nombre);

    $stmt = $conexion->prepare("INSERT INTO gala_imagenes (ruta) VALUES (?)");
    $stmt->bind_param("s",$nombre);
    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}

if ($accion === 'listarImagenes') {
    $res = $conexion->query("SELECT * FROM gala_imagenes ORDER BY id DESC");
    echo json_encode(['ok'=>true,'imagenes'=>$res->fetch_all(MYSQLI_ASSOC)]);
    exit;
}

if ($accion === 'borrarImagen') {
    $id = intval($_GET['id']);
    $res = $conexion->query("SELECT ruta FROM gala_imagenes WHERE id=$id");
    if ($img = $res->fetch_assoc()) {
        @unlink("../../uploads/".$img['ruta']);
        $conexion->query("DELETE FROM gala_imagenes WHERE id=$id");
    }
    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   GUARDAR EDICIÓN
========================= */
if ($accion === 'guardarEdicion') {

    $texto = $conexion->query("SELECT texto_resumen FROM gala WHERE id=1")
        ->fetch_assoc()['texto_resumen'];

    $stmt = $conexion->prepare("INSERT INTO ediciones (texto) VALUES (?)");
    $stmt->bind_param("s",$texto);
    $stmt->execute();
    $idEdicion = $stmt->insert_id;

    $imgs = $conexion->query("SELECT ruta FROM gala_imagenes");
    while ($img = $imgs->fetch_assoc()) {
        $stmt = $conexion->prepare("
            INSERT INTO ediciones_imagenes (id_edicion,ruta)
            VALUES (?,?)
        ");
        $stmt->bind_param("is",$idEdicion,$img['ruta']);
        $stmt->execute();
    }

    $conexion->query("DELETE FROM gala_imagenes");
    $conexion->query("UPDATE gala SET texto_resumen=NULL");

    echo json_encode(['ok'=>true]);
    exit;
}

echo json_encode(['ok'=>false,'error'=>'Acción no válida']);
