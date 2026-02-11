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

    $res = $conexion->query("
        SELECT modo, fecha_edicion 
        FROM gala 
        WHERE id = 1
    ");

    $fila = $res->fetch_assoc();

    echo json_encode([
        'ok'    => true,
        'modo'  => $fila['modo'],
        'fecha' => $fila['fecha_edicion']
    ]);
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
   CREAR SECCIÓN (PRE-GALA)
========================= */
if ($accion === 'crearSeccion') {

    $titulo = trim($_POST['titulo'] ?? '');
    $hora = trim($_POST['hora'] ?? '');
    $sala = trim($_POST['sala'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');

    if ($titulo === '' || $hora === '' || $sala === '' || $descripcion === '') {
        echo json_encode(['ok'=>false,'error'=>'Todos los campos son obligatorios']);
        exit;
    }

    if (!preg_match('/^\d{2}:\d{2}$/', $hora)) {
        echo json_encode(['ok'=>false,'error'=>'Hora inválida']);
        exit;
    }

    $stmt = $conexion->prepare("
        INSERT INTO gala_secciones (titulo, hora, sala, descripcion)
        VALUES (?,?,?,?)
    ");
    $stmt->bind_param("ssss", $titulo, $hora, $sala, $descripcion);
    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   EDITAR SECCIÓN
========================= */
if ($accion === 'editarSeccion') {

    $id = intval($_POST['id'] ?? 0);
    if ($id <= 0) {
        echo json_encode(['ok'=>false,'error'=>'ID no recibido']);
        exit;
    }

    $titulo = trim($_POST['titulo'] ?? '');
    $hora = trim($_POST['hora'] ?? '');
    $sala = trim($_POST['sala'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');

    if ($titulo === '' || $hora === '' || $sala === '' || $descripcion === '') {
        echo json_encode(['ok'=>false,'error'=>'Todos los campos son obligatorios']);
        exit;
    }

    if (!preg_match('/^\d{2}:\d{2}$/', $hora)) {
        echo json_encode(['ok'=>false,'error'=>'Hora inválida']);
        exit;
    }

    $stmt = $conexion->prepare("
        UPDATE gala_secciones 
        SET titulo = ?, hora = ?, sala = ?, descripcion = ?
        WHERE id = ?
    ");
    $stmt->bind_param("ssssi", $titulo, $hora, $sala, $descripcion, $id);
    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   LISTAR SECCIONES
========================= */
if ($accion === 'listarSecciones') {
    $res = $conexion->query("SELECT * FROM gala_secciones ORDER BY hora");
    echo json_encode(['ok'=>true,'secciones'=>$res->fetch_all(MYSQLI_ASSOC)]);
    exit;
}

/* =========================
   BORRAR SECCIÓN
========================= */
if ($accion === 'borrarSeccion') {
    $id = intval($_GET['id']);
    $stmt = $conexion->prepare("DELETE FROM gala_secciones WHERE id=?");
    $stmt->bind_param("i",$id);
    $stmt->execute();
    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   GUARDAR RESUMEN (POST-GALA)
========================= */
if ($accion === 'guardarResumen') {

    $texto = trim($_POST['texto'] ?? '');

    if ($texto === '') {
        echo json_encode(['ok'=>false,'error'=>'Texto vacío']);
        exit;
    }

    if (strlen($texto) > 5000) {
        echo json_encode(['ok'=>false,'error'=>'El resumen es demasiado largo']);
        exit;
    }

    $stmt = $conexion->prepare("
        UPDATE gala 
        SET texto_resumen = ?
        WHERE id = 1
    ");
    $stmt->bind_param("s", $texto);
    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   SUBIR IMAGEN (POST-GALA)
========================= */
if ($accion === 'subirImagen') {

    if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== 0) {
        echo json_encode(['ok'=>false,'error'=>'No se recibió la imagen']);
        exit;
    }

    $permitidos = ['image/jpeg','image/png','image/webp'];
    if (!in_array($_FILES['imagen']['type'], $permitidos)) {
        echo json_encode(['ok'=>false,'error'=>'Formato no permitido (solo JPG, PNG, WEBP)']);
        exit;
    }

    if ($_FILES['imagen']['size'] > 5 * 1024 * 1024) {
        echo json_encode(['ok'=>false,'error'=>'La imagen supera los 5MB']);
        exit;
    }

    $dir = "../../uploads/";
    if (!is_dir($dir)) mkdir($dir,0777,true);

    $nombre = uniqid()."_".basename($_FILES['imagen']['name']);
    move_uploaded_file($_FILES['imagen']['tmp_name'], $dir.$nombre);

    $stmt = $conexion->prepare("INSERT INTO gala_imagenes (ruta) VALUES (?)");
    $stmt->bind_param("s",$nombre);
    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   LISTAR IMÁGENES
========================= */
if ($accion === 'listarImagenes') {
    $res = $conexion->query("SELECT * FROM gala_imagenes ORDER BY id DESC");
    echo json_encode(['ok'=>true,'imagenes'=>$res->fetch_all(MYSQLI_ASSOC)]);
    exit;
}

/* =========================
   BORRAR IMAGEN
========================= */
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
   GUARDAR FECHA DE LA GALA
========================= */
if ($accion === 'guardarFecha') {

    $fecha = $_POST['fecha'] ?? null;

    if (!$fecha || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        echo json_encode(['ok'=>false,'error'=>'Formato de fecha inválido']);
        exit;
    }

    if (!strtotime($fecha)) {
        echo json_encode(['ok'=>false,'error'=>'Fecha no válida']);
        exit;
    }

    $stmt = $conexion->prepare("
        UPDATE gala 
        SET fecha_edicion = ? 
        WHERE id = 1
    ");
    $stmt->bind_param("s", $fecha);
    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   GALA PÚBLICA
========================= */
if ($accion === 'publico') {

    $gala = $conexion->query("
        SELECT modo, texto_resumen, fecha_edicion
        FROM gala
        WHERE id = 1
    ")->fetch_assoc();

    if ($gala['modo'] === 'PRE') {

        $secciones = $conexion->query("
            SELECT titulo, hora, sala, descripcion
            FROM gala_secciones
            ORDER BY hora
        ")->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            'ok'        => true,
            'modo'      => 'PRE',
            'fecha'     => $gala['fecha_edicion'],
            'secciones' => $secciones
        ]);
        exit;
    }

    // POST
    $imagenes = $conexion->query("
        SELECT ruta FROM gala_imagenes ORDER BY id DESC
    ")->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        'ok'       => true,
        'modo'     => 'POST',
        'texto'    => $gala['texto_resumen'],
        'imagenes' => $imagenes
    ]);
    exit;
}

echo json_encode(['ok'=>false,'error'=>'Acción no válida']);
