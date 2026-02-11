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
   SECCIONES PRE
========================= */
if ($accion === 'crearSeccion') {

    $stmt = $conexion->prepare("
        INSERT INTO gala_secciones (titulo, hora, sala, descripcion)
        VALUES (?,?,?,?)
    ");

    $stmt->bind_param(
        "ssss",
        $_POST['titulo'],
        $_POST['hora'],
        $_POST['sala'],
        $_POST['descripcion']
    );

    $stmt->execute();

    echo json_encode(['ok'=>true]);
    exit;
}
/* =========================
   EDITAR SECCIÓN PRE-GALA
========================= */
if ($accion === 'editarSeccion') {

    $id = $_POST['id'] ?? null;

    if (!$id) {
        echo json_encode(['ok'=>false,'error'=>'ID no recibido']);
        exit;
    }

    $stmt = $conexion->prepare("
        UPDATE gala_secciones 
        SET titulo = ?, hora = ?, sala = ?, descripcion = ?
        WHERE id = ?
    ");

    $stmt->bind_param(
        "ssssi",
        $_POST['titulo'],
        $_POST['hora'],
        $_POST['sala'],
        $_POST['descripcion'],
        $id
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
   $stmt = $conexion->prepare("DELETE FROM gala_secciones WHERE id=?");
    $stmt->bind_param("i",$id);
    $stmt->execute();
    echo json_encode(['ok'=>true]);
    exit;
}

/* =========================
   GUARDAR TEXTO RESUMEN (POST-GALA)
========================= */
if ($accion === 'guardarResumen') {

    $texto = $_POST['texto'] ?? '';

    if (!$texto) {
        echo json_encode(['ok'=>false,'error'=>'Texto vacío']);
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
// Acción para guardar la edición
if ($accion === 'guardarEdicion') {
    $anio = $_POST['anio'] ?? null;
    $texto = $_POST['texto'] ?? '';
    
    // Verificar si se recibieron las imágenes
    if (isset($_FILES['imagenes'])) {
        $imagenes = $_FILES['imagenes'];
    } else {
        $imagenes = [];
    }

    // Verifica que el año y el texto no estén vacíos
    if (!$anio || !$texto || empty($imagenes)) {
        echo json_encode(['ok' => false, 'error' => 'Faltan datos']);
        exit;
    }

    // Guardar la edición en la base de datos
    $stmt = $conexion->prepare("INSERT INTO ediciones (texto_resumen, fecha, anio) VALUES (?, CURDATE(), ?)");
    $stmt->bind_param("si", $texto, $anio);
    $stmt->execute();
    $id_edicion = $conexion->insert_id;

    // Guardar las imágenes
    foreach ($imagenes['tmp_name'] as $key => $tmp_name) {
        $filename = uniqid() . "_" . $imagenes['name'][$key]; // Generar nombre único
        $uploadDir = '../../uploads/';
        $filepath = $uploadDir . $filename;

        // Mover el archivo al directorio 'uploads'
        if (move_uploaded_file($tmp_name, $filepath)) {
            // Guardar la ruta de la imagen en la base de datos
            $stmt = $conexion->prepare("INSERT INTO ediciones_imagenes (id_edicion, ruta) VALUES (?, ?)");
            $stmt->bind_param("is", $id_edicion, $filename);
            $stmt->execute();
        } else {
            echo json_encode(['ok' => false, 'error' => 'Error al subir la imagen']);
            exit;
        }
    }

    echo json_encode(['ok' => true]);
}



/* =========================
   GUARDAR FECHA DE LA GALA
========================= */
if ($accion === 'guardarFecha') {

    $fecha = $_POST['fecha'] ?? null;

    if (!$fecha) {
        echo json_encode(['ok' => false, 'error' => 'Fecha no válida']);
        exit;
    }

    $stmt = $conexion->prepare("
        UPDATE gala 
        SET fecha_edicion = ? 
        WHERE id = 1
    ");
    $stmt->bind_param("s", $fecha);
    $stmt->execute();

    echo json_encode(['ok' => true]);
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
