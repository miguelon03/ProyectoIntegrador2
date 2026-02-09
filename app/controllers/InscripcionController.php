<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require "../../config/database.php";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function json_exit($arr)
{
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

$accion = $_GET['accion'] ?? $_POST['accion'] ?? null;

/* ======================================================
   PUBLICO: ESTADO SESIÓN + LÍMITE INSCRIPCIONES
   - usado por public/js/inscripcion.js
====================================================== */
if ($accion === 'estado') {
    $tieneSesion = isset($_SESSION['id_usuario']);
    $total = 0;

    if ($tieneSesion) {
        $id_usuario = intval($_SESSION['id_usuario']);
        $stmt = $conexion->prepare("SELECT COUNT(*) AS total FROM inscripciones WHERE id_usuario=?");
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $total = intval($row['total'] ?? 0);
    }

    json_exit([
        'ok' => true,
        'tieneSesion' => $tieneSesion,
        'tipo' => $_SESSION['tipo'] ?? null,
        'total' => $total,
    ]);
}

/* ======================================================
   PUBLICO: COMPROBAR DUPLICADOS
   - usado por public/js/inscripcion.js cuando NO hay sesión
====================================================== */
if ($accion === 'comprobarDuplicados') {

    // Si ya hay sesión, no tiene sentido comprobar duplicados de alta
    if (isset($_SESSION['id_usuario'])) {
        json_exit(['ok' => true]);
    }

    $usuario = trim($_POST['usuario'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $dni = trim($_POST['dni'] ?? '');
    $expediente = trim($_POST['expediente'] ?? '');

    // Flags de duplicado
    $dupUsuario = false;
    $dupEmail = false;
    $dupDni = false;
    $dupExp = false;

    if ($usuario !== '') {
        $stmt = $conexion->prepare("SELECT 1 FROM participantes WHERE usuario=? LIMIT 1");
        $stmt->bind_param("s", $usuario);
        $stmt->execute();
        $dupUsuario = (bool) $stmt->get_result()->fetch_row();
    }

    // email/dni/expediente están en inscripciones
    if ($email !== '') {
        $stmt = $conexion->prepare("SELECT 1 FROM inscripciones WHERE email=? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $dupEmail = (bool) $stmt->get_result()->fetch_row();
    }

    if ($dni !== '') {
        $stmt = $conexion->prepare("SELECT 1 FROM inscripciones WHERE dni=? LIMIT 1");
        $stmt->bind_param("s", $dni);
        $stmt->execute();
        $dupDni = (bool) $stmt->get_result()->fetch_row();
    }

    if ($expediente !== '') {
        $stmt = $conexion->prepare("SELECT 1 FROM inscripciones WHERE expediente=? LIMIT 1");
        $stmt->bind_param("s", $expediente);
        $stmt->execute();
        $dupExp = (bool) $stmt->get_result()->fetch_row();
    }

    $ok = !($dupUsuario || $dupEmail || $dupDni || $dupExp);

    json_exit([
        'ok' => $ok,
        'usuario' => $dupUsuario,
        'email' => $dupEmail,
        'dni' => $dupDni,
        'expediente' => $dupExp,
    ]);
}

/* ======================================================
   ORGANIZADOR: LISTAR / ACEPTAR / RECHAZAR / NOMINAR
====================================================== */
if ($accion && in_array($accion, ['listar', 'aceptar', 'rechazar', 'nominar'], true)) {

    if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
        json_exit(['ok' => false, 'error' => 'No autorizado']);
    }

    if ($accion === 'listar') {
        $res = $conexion->query("
            SELECT 
                i.id_inscripcion,
                i.id_usuario,
                i.ficha,
                i.cartel,
                i.sinopsis,
                i.nombre_responsable,
                i.email,
                i.dni,
                i.expediente,
                i.video,
                i.estado,
                i.motivo_rechazo,
                i.fecha,
                p.usuario
            FROM inscripciones i
            LEFT JOIN participantes p ON p.id_usuario = i.id_usuario
            ORDER BY i.fecha DESC
        ");

        json_exit(['ok' => true, 'candidaturas' => $res->fetch_all(MYSQLI_ASSOC)]);
    }

    if ($accion === 'aceptar') {
        $id = intval($_GET['id'] ?? 0);
        if (!$id) json_exit(['ok' => false, 'error' => 'ID inválido']);

        $stmt = $conexion->prepare("UPDATE inscripciones SET estado='ACEPTADO' WHERE id_inscripcion=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        json_exit(['ok' => true]);
    }

    if ($accion === 'nominar') {
        $id = intval($_GET['id'] ?? 0);
        if (!$id) json_exit(['ok' => false, 'error' => 'ID inválido']);

        $stmt = $conexion->prepare("UPDATE inscripciones SET estado='NOMINADO' WHERE id_inscripcion=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        json_exit(['ok' => true]);
    }

    if ($accion === 'rechazar') {
        $id = intval($_POST['id'] ?? 0);
        $motivo = trim($_POST['motivo'] ?? '');

        if (!$id || $motivo === '') {
            json_exit(['ok' => false, 'error' => 'Datos incompletos']);
        }

        $stmt = $conexion->prepare("
            UPDATE inscripciones 
            SET estado='RECHAZADO', motivo_rechazo=?
            WHERE id_inscripcion=?
        ");
        $stmt->bind_param("si", $motivo, $id);
        $stmt->execute();

        json_exit(['ok' => true]);
    }
}

/* ======================================================
   PARTICIPANTE: MI DETALLE
====================================================== */
if ($accion === 'mi_detalle') {

    if (!isset($_SESSION['id_usuario']) || ($_SESSION['tipo'] ?? '') !== 'participante') {
        json_exit(['ok' => false, 'error' => 'No autorizado']);
    }

    $id_usuario = intval($_SESSION['id_usuario']);

    $stmt = $conexion->prepare("
        SELECT 
            id_inscripcion,
            ficha,
            cartel,
            sinopsis,
            nombre_responsable,
            email,
            dni,
            expediente,
            video,
            estado,
            motivo_rechazo,
            fecha
        FROM inscripciones
        WHERE id_usuario = ?
        ORDER BY fecha DESC
        LIMIT 1
    ");
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();

    json_exit(['ok' => true, 'inscripcion' => $row]);
}

/* ======================================================
   PARTICIPANTE: ACTUALIZAR + REENVIAR
====================================================== */
if ($accion === 'actualizar') {

    if (!isset($_SESSION['id_usuario']) || ($_SESSION['tipo'] ?? '') !== 'participante') {
        json_exit(['ok' => false, 'error' => 'No autorizado']);
    }

    $id_usuario = intval($_SESSION['id_usuario']);

    // traer la inscripción actual del usuario
    $stmt = $conexion->prepare("
        SELECT id_inscripcion, ficha, cartel, estado
        FROM inscripciones
        WHERE id_usuario=?
        ORDER BY fecha DESC
        LIMIT 1
    ");
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $actual = $stmt->get_result()->fetch_assoc();

    if (!$actual) {
        json_exit(['ok' => false, 'error' => 'No tienes inscripción para actualizar']);
    }

    // ✅ Solo se permite actualizar/reenviar si está RECHAZADO
    if (strtoupper($actual['estado'] ?? '') !== 'RECHAZADO') {
        json_exit(['ok' => false, 'error' => 'Solo puedes reenviar si tu candidatura está RECHAZADA']);
    }

    $id_inscripcion = intval($actual['id_inscripcion']);

    $sinopsis = trim($_POST['sinopsis'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $dni = trim($_POST['dni'] ?? '');
    $expediente = trim($_POST['expediente'] ?? '');
    $video = trim($_POST['video'] ?? '');
    $nombre_responsable = trim($_POST['nombre_responsable'] ?? '');

    if ($sinopsis === '' || $email === '' || $dni === '' || $expediente === '' || $video === '') {
        json_exit(['ok' => false, 'error' => 'Rellena sinopsis, email, dni, expediente y vídeo']);
    }

    // uploads opcionales
    $uploadsDirAbs = realpath(__DIR__ . "/../../") . "/uploads/";
    if (!is_dir($uploadsDirAbs)) @mkdir($uploadsDirAbs, 0777, true);

    $fichaPath = $actual['ficha'];
    $cartelPath = $actual['cartel'];

    if (!empty($_FILES['ficha']['name']) && is_uploaded_file($_FILES['ficha']['tmp_name'])) {
        $nombre = uniqid("ficha_") . "_" . basename($_FILES['ficha']['name']);
        $dest = $uploadsDirAbs . $nombre;
        move_uploaded_file($_FILES['ficha']['tmp_name'], $dest);
        $fichaPath = "/ProyectoIntegrador2/uploads/" . $nombre;
    }

    if (!empty($_FILES['cartel']['name']) && is_uploaded_file($_FILES['cartel']['tmp_name'])) {
        $nombre = uniqid("cartel_") . "_" . basename($_FILES['cartel']['name']);
        $dest = $uploadsDirAbs . $nombre;
        move_uploaded_file($_FILES['cartel']['tmp_name'], $dest);
        $cartelPath = "/ProyectoIntegrador2/uploads/" . $nombre;
    }

    $stmt2 = $conexion->prepare("
        UPDATE inscripciones
        SET 
            ficha=?,
            cartel=?,
            sinopsis=?,
            nombre_responsable=?,
            email=?,
            dni=?,
            expediente=?,
            video=?,
            estado='PENDIENTE',
            motivo_rechazo=NULL
        WHERE id_inscripcion=? AND id_usuario=?
    ");
    $stmt2->bind_param(
        "ssssssssii",
        $fichaPath,
        $cartelPath,
        $sinopsis,
        $nombre_responsable,
        $email,
        $dni,
        $expediente,
        $video,
        $id_inscripcion,
        $id_usuario
    );
    $stmt2->execute();

    json_exit(['ok' => true]);
}


/* ======================================================
   INSCRIPCIÓN PARTICIPANTE (crear) - SIN accion
====================================================== */
if (!$accion && $_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!isset($_SESSION['id_usuario'])) {

        // ✅ recoger datos antes de validar
        $usuario = trim($_POST['usuario'] ?? '');
        $contrasena = $_POST['contrasena'] ?? '';

        if ($usuario === '' || $contrasena === '') {
            json_exit(['ok' => false, 'error' => 'Usuario y contraseña obligatorios']);
        }

        // ✅ comprobar usuario duplicado (ahora con $usuario definido)
        $stmt = $conexion->prepare("SELECT id_usuario FROM participantes WHERE usuario=?");
        $stmt->bind_param("s", $usuario);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            json_exit(['ok' => false, 'error' => 'El nombre de usuario ya existe']);
        }

        $hash = password_hash($contrasena, PASSWORD_DEFAULT);

        $stmt = $conexion->prepare("INSERT INTO participantes (usuario, contrasena) VALUES (?,?)");
        $stmt->bind_param("ss", $usuario, $hash);
        $stmt->execute();

        $_SESSION['id_usuario'] = $conexion->insert_id;
        $_SESSION['usuario'] = $usuario;
        $_SESSION['tipo'] = 'participante';
    }

    $id_usuario = intval($_SESSION['id_usuario']);

    $sinopsis = trim($_POST['sinopsis'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $dni = trim($_POST['dni'] ?? '');
    $expediente = trim($_POST['expediente'] ?? '');
    $video = trim($_POST['video'] ?? '');
    $nombre_responsable = trim($_POST['usuario'] ?? ($_SESSION['usuario'] ?? ''));

    if ($sinopsis === '' || $email === '' || $dni === '' || $expediente === '' || $video === '') {
        json_exit(['ok' => false, 'error' => 'Datos incompletos']);
    }

    $uploadsDirAbs = realpath(__DIR__ . "/../../") . "/uploads/";
    if (!is_dir($uploadsDirAbs)) @mkdir($uploadsDirAbs, 0777, true);

    if (empty($_FILES['ficha']['name']) || empty($_FILES['cartel']['name'])) {
        json_exit(['ok' => false, 'error' => 'Ficha y cartel son obligatorios']);
    }

    $fichaName = uniqid("ficha_") . "_" . basename($_FILES['ficha']['name']);
    $cartelName = uniqid("cartel_") . "_" . basename($_FILES['cartel']['name']);

    $fichaDest = $uploadsDirAbs . $fichaName;
    $cartelDest = $uploadsDirAbs . $cartelName;

    move_uploaded_file($_FILES['ficha']['tmp_name'], $fichaDest);
    move_uploaded_file($_FILES['cartel']['tmp_name'], $cartelDest);

    $fichaPath = "/ProyectoIntegrador2/uploads/" . $fichaName;
    $cartelPath = "/ProyectoIntegrador2/uploads/" . $cartelName;

    $stmt2 = $conexion->prepare("
        INSERT INTO inscripciones
        (id_usuario, ficha, cartel, sinopsis, nombre_responsable, email, dni, expediente, video, estado)
        VALUES (?,?,?,?,?,?,?,?,?, 'PENDIENTE')
    ");
    $stmt2->bind_param(
        "issssssss",
        $id_usuario,
        $fichaPath,
        $cartelPath,
        $sinopsis,
        $nombre_responsable,
        $email,
        $dni,
        $expediente,
        $video
    );
    $stmt2->execute();

    json_exit(['ok' => true]);
}

json_exit(['ok' => false, 'error' => 'Acción inválida']);
