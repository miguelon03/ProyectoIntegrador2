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
   PUBLICO: CONTAR CANDIDATURAS (para botón 2ª)
====================================================== */
if ($accion === 'contar') {
    if (!isset($_SESSION['id_usuario'])) {
        json_exit(['ok' => false, 'error' => 'No autorizado']);
    }

    $id_usuario = intval($_SESSION['id_usuario']);
    $stmt = $conexion->prepare("SELECT COUNT(*) AS total FROM inscripciones WHERE id_usuario=?");
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    json_exit(['ok' => true, 'total' => intval($row['total'] ?? 0)]);
}

/* ======================================================
   PUBLICO: COMPROBAR DUPLICADOS
====================================================== */
if ($accion === 'comprobarDuplicados') {

    if (isset($_SESSION['id_usuario'])) {
        json_exit(['ok' => true]);
    }

    $usuario = trim($_POST['usuario'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $dni = trim($_POST['dni'] ?? '');
    $expediente = trim($_POST['expediente'] ?? '');

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

        if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
            json_exit(['ok' => false, 'error' => 'No autorizado']);
        }

                $tipo = trim($_GET['tipo'] ?? '');

        // Si no viene tipo, devolvemos todas (el frontend las separa por Alumno/Alumni)
        if ($tipo !== '' && $tipo !== 'Alumno' && $tipo !== 'Alumni') {
            json_exit(['ok' => false, 'error' => 'Tipo inválido']);
        }

        if ($tipo === '') {

            $stmt = $conexion->prepare("
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
                    i.tipo_participante,
                    i.estado,
                    i.motivo_rechazo,
                    i.fecha,
                    p.usuario
                FROM inscripciones i
                LEFT JOIN participantes p ON p.id_usuario = i.id_usuario
                ORDER BY i.fecha DESC
            ");

            $stmt->execute();

        } else {

            $stmt = $conexion->prepare("
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
                    i.tipo_participante,
                    i.estado,
                    i.motivo_rechazo,
                    i.fecha,
                    p.usuario
                FROM inscripciones i
                LEFT JOIN participantes p ON p.id_usuario = i.id_usuario
                WHERE i.tipo_participante = ?
                ORDER BY i.fecha DESC
            ");

            $stmt->bind_param("s", $tipo);
            $stmt->execute();
        }

        json_exit([
            'ok' => true,
            'candidaturas' => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)
        ]);
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

    // Traer tipo y estado de la candidatura
    $st = $conexion->prepare("
        SELECT tipo_participante, estado
        FROM inscripciones
        WHERE id_inscripcion=?
        LIMIT 1
    ");
    $st->bind_param("i", $id);
    $st->execute();
    $row = $st->get_result()->fetch_assoc();

    if (!$row) {
        json_exit(['ok' => false, 'error' => 'Candidatura no encontrada']);
    }

    $tipo = trim($row['tipo_participante'] ?? '');
    if ($tipo !== 'Alumno' && $tipo !== 'Alumni') {
        json_exit(['ok' => false, 'error' => 'Tipo inválido']);
    }

    $estadoActual = strtoupper(trim($row['estado'] ?? ''));
    if ($estadoActual !== 'ACEPTADO') {
        json_exit(['ok' => false, 'error' => 'Solo puedes nominar candidaturas ACEPTADAS']);
    }

    // ✅ Máximo 5 nominados por categoría (Alumno / Alumni)
    $st2 = $conexion->prepare("
        SELECT COUNT(*) AS total
        FROM inscripciones
        WHERE estado='NOMINADO'
          AND tipo_participante=?
    ");
    $st2->bind_param("s", $tipo);
    $st2->execute();
    $total = intval($st2->get_result()->fetch_assoc()['total'] ?? 0);

    if ($total >= 5) {
        json_exit(['ok' => false, 'error' => "Ya hay 5 nominados en la categoría $tipo. No puedes nominar más."]);
    }

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
            tipo_participante,
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

    // Si viene id_inscripcion, actualizamos esa candidatura (permite elegir cuál reenviar).
    // Si no viene, por compatibilidad usamos la última.
    $id_inscripcion = intval($_POST['id_inscripcion'] ?? 0);

    if ($id_inscripcion > 0) {
        $stmt = $conexion->prepare("
            SELECT id_inscripcion, ficha, cartel, estado, tipo_participante
            FROM inscripciones
            WHERE id_usuario=? AND id_inscripcion=?
            LIMIT 1
        ");
        $stmt->bind_param("ii", $id_usuario, $id_inscripcion);
    } else {
        $stmt = $conexion->prepare("
            SELECT id_inscripcion, ficha, cartel, estado, tipo_participante
            FROM inscripciones
            WHERE id_usuario=?
            ORDER BY fecha DESC
            LIMIT 1
        ");
        $stmt->bind_param("i", $id_usuario);
    }

    $stmt->execute();
    $actual = $stmt->get_result()->fetch_assoc();

    if (!$actual) {
        json_exit(['ok' => false, 'error' => 'No tienes candidatura para actualizar']);
    }

    // ✅ Solo se permite actualizar/reenviar si está RECHAZADO
    // (permitimos también 'RECHAZADA' por si algún dato histórico quedó con esa variante)
    $estadoActual = strtoupper(trim($actual['estado'] ?? ''));
    if (!in_array($estadoActual, ['RECHAZADO', 'RECHAZADA'], true)) {
        json_exit(['ok' => false, 'error' => 'Solo puedes reenviar si tu candidatura está RECHAZADA']);
    }

    $id_inscripcion = intval($actual['id_inscripcion']);

    $sinopsis = trim($_POST['sinopsis'] ?? '');
    $video = trim($_POST['video'] ?? '');

    if ($sinopsis === '' || $video === '') {
        json_exit(['ok' => false, 'error' => 'Rellena sinopsis y vídeo']);
    }

    if (stripos($video, 'http') !== 0) {
        json_exit(['ok' => false, 'error' => 'El vídeo debe ser un enlace válido (http/https)']);
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
            video=?,
            estado='PENDIENTE',
            motivo_rechazo=NULL
        WHERE id_inscripcion=? AND id_usuario=?
    ");
    $stmt2->bind_param(
        "ssssii",
        $fichaPath,
        $cartelPath,
        $sinopsis,
        $video,
        $id_inscripcion,
        $id_usuario
    );
    $stmt2->execute();

    json_exit(['ok' => true]);
}

/* ======================================================
   PARTICIPANTE: CREAR SEGUNDA CANDIDATURA (solo datos candidatura)
====================================================== */
if ($accion === 'crear_segunda') {

    if (!isset($_SESSION['id_usuario']) || ($_SESSION['tipo'] ?? '') !== 'participante') {
        json_exit(['ok' => false, 'error' => 'No autorizado']);
    }

    $id_usuario = intval($_SESSION['id_usuario']);

    // ✅ Límite: máximo 2 candidaturas
    $stmtLim = $conexion->prepare("SELECT COUNT(*) AS total FROM inscripciones WHERE id_usuario=?");
    $stmtLim->bind_param("i", $id_usuario);
    $stmtLim->execute();
    $rowLim = $stmtLim->get_result()->fetch_assoc();
    $totalIns = intval($rowLim['total'] ?? 0);

    if ($totalIns >= 2) {
        json_exit(['ok' => false, 'error' => 'Has alcanzado el máximo de 2 candidaturas']);
    }

    // Tomamos los datos personales de la última inscripción (se mantienen sincronizados desde PerfilController)
    $stmtPers = $conexion->prepare("
        SELECT nombre_responsable, email, dni, expediente
        FROM inscripciones
        WHERE id_usuario=?
        ORDER BY fecha DESC
        LIMIT 1
    ");
    $stmtPers->bind_param("i", $id_usuario);
    $stmtPers->execute();
    $pers = $stmtPers->get_result()->fetch_assoc();

    if (!$pers) {
        json_exit(['ok' => false, 'error' => 'No se han encontrado datos personales. Crea tu primera candidatura desde Inscripción.']);
    }

    $sinopsis = trim($_POST['sinopsis'] ?? '');
    $video = trim($_POST['video'] ?? '');
    $tipo_participante = trim($_POST['tipo_participante'] ?? '');

    if ($tipo_participante !== 'Alumno' && $tipo_participante !== 'Alumni') {
        json_exit(['ok' => false, 'error' => 'Debes seleccionar Alumno o Alumni']);
    }

    if ($sinopsis === '' || $video === '') {
        json_exit(['ok' => false, 'error' => 'Rellena sinopsis y vídeo']);
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
        (id_usuario, ficha, cartel, sinopsis, nombre_responsable, email, dni, expediente, video, tipo_participante, estado)
        VALUES (?,?,?,?,?,?,?,?,?,?, 'PENDIENTE')
    ");
    $stmt2->bind_param(
        "isssssssss",
        $id_usuario,
        $fichaPath,
        $cartelPath,
        $sinopsis,
        $pers['nombre_responsable'],
        $pers['email'],
        $pers['dni'],
        $pers['expediente'],
        $video,
        $tipo_participante
    );
    $stmt2->execute();

    json_exit(['ok' => true]);
}

/* ======================================================
   INSCRIPCIÓN PARTICIPANTE (crear) - primera candidatura
====================================================== */
if (!$accion && $_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!isset($_SESSION['id_usuario'])) {

        $usuario = trim($_POST['usuario'] ?? '');
        $contrasena = $_POST['contrasena'] ?? '';

        if ($usuario === '' || $contrasena === '') {
            json_exit(['ok' => false, 'error' => 'Usuario y contraseña obligatorios']);
        }

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

    // ✅ Límite: máximo 2 candidaturas por usuario
    $stmtLim = $conexion->prepare("SELECT COUNT(*) AS total FROM inscripciones WHERE id_usuario=?");
    $stmtLim->bind_param("i", $id_usuario);
    $stmtLim->execute();
    $rowLim = $stmtLim->get_result()->fetch_assoc();
    $totalIns = intval($rowLim['total'] ?? 0);
    if ($totalIns >= 2) {
        json_exit(['ok' => false, 'error' => 'Has alcanzado el máximo de 2 candidaturas']);
    }

    $sinopsis = trim($_POST['sinopsis'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $dni = trim($_POST['dni'] ?? '');
    $expediente = trim($_POST['expediente'] ?? '');
    $video = trim($_POST['video'] ?? '');
    $nombre_responsable = trim($_POST['usuario'] ?? ($_SESSION['usuario'] ?? ''));
    $tipo_participante = trim($_POST['tipo_participante'] ?? '');

    if ($tipo_participante !== 'Alumno' && $tipo_participante !== 'Alumni') {
        json_exit(['ok' => false, 'error' => 'Debes seleccionar Alumno o Alumni']);
    }

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
        (id_usuario, ficha, cartel, sinopsis, nombre_responsable, email, dni, expediente, video, tipo_participante, estado)
        VALUES (?,?,?,?,?,?,?,?,?,?, 'PENDIENTE')
    ");
    $stmt2->bind_param(
        "isssssssss",
        $id_usuario,
        $fichaPath,
        $cartelPath,
        $sinopsis,
        $nombre_responsable,
        $email,
        $dni,
        $expediente,
        $video,
        $tipo_participante
    );
    $stmt2->execute();

    json_exit(['ok' => true]);
}

json_exit(['ok' => false, 'error' => 'Acción inválida']);
