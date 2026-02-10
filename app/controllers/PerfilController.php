<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require "../../config/database.php";

function json_exit($arr) {
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

function column_exists($conexion, $table, $column) {
    $dbRes = $conexion->query("SELECT DATABASE() AS db")->fetch_assoc();
    $db = $dbRes['db'];

    $stmt = $conexion->prepare("
        SELECT COUNT(*) c
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    ");
    $stmt->bind_param("sss", $db, $table, $column);
    $stmt->execute();
    $c = $stmt->get_result()->fetch_assoc()['c'];
    return intval($c) > 0;
}

if (!isset($_SESSION['id_usuario'])) {
    json_exit(['ok' => false, 'error' => 'No autorizado']);
}

$id = intval($_SESSION['id_usuario']);

/* ======================================================
   ACTUALIZAR PERFIL (datos personales)
   POST: accion=actualizar_perfil
   - Actualiza usuario (y contraseña opcional) en participantes
   - Actualiza email/dni/expediente/nombre_responsable en inscripciones
====================================================== */
$accion = $_GET['accion'] ?? $_POST['accion'] ?? null;

if ($accion === 'actualizar_perfil' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario = trim($_POST['usuario'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $dni = strtoupper(trim($_POST['dni'] ?? ''));
    $expediente = trim($_POST['expediente'] ?? '');
    $contrasena = $_POST['contrasena'] ?? '';

    $errores = [];
    if ($usuario === '' || mb_strlen($usuario) < 3) $errores[] = 'Usuario inválido';
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errores[] = 'Email inválido';
    if ($dni === '' || !preg_match('/^\d{8}[A-Z]$/', $dni)) $errores[] = 'DNI inválido';
    if ($expediente === '' || mb_strlen($expediente) < 4) $errores[] = 'Expediente inválido';
    if ($contrasena !== '' && (mb_strlen($contrasena) < 4 || mb_strlen($contrasena) > 12)) $errores[] = 'Contraseña inválida';

    if ($errores) {
        json_exit(['ok' => false, 'error' => implode(' · ', $errores)]);
    }

    // Usuario único
    $stmtU = $conexion->prepare("SELECT id_usuario FROM participantes WHERE usuario=? AND id_usuario<>? LIMIT 1");
    $stmtU->bind_param("si", $usuario, $id);
    $stmtU->execute();
    $dup = $stmtU->get_result()->fetch_assoc();
    if ($dup) {
        json_exit(['ok' => false, 'error' => 'El nombre de usuario ya existe']);
    }

    // Update participantes
    if ($contrasena !== '') {
        $hash = password_hash($contrasena, PASSWORD_DEFAULT);
        $stmtP = $conexion->prepare("UPDATE participantes SET usuario=?, contrasena=? WHERE id_usuario=?");
        $stmtP->bind_param("ssi", $usuario, $hash, $id);
    } else {
        $stmtP = $conexion->prepare("UPDATE participantes SET usuario=? WHERE id_usuario=?");
        $stmtP->bind_param("si", $usuario, $id);
    }
    $stmtP->execute();

    $_SESSION['usuario'] = $usuario;

    // Update inscripciones (si existe columna nombre_responsable)
    $tiene_nombre = column_exists($conexion, 'inscripciones', 'nombre_responsable');
    if ($tiene_nombre) {
        $stmtI = $conexion->prepare("UPDATE inscripciones SET nombre_responsable=?, email=?, dni=?, expediente=? WHERE id_usuario=?");
        $stmtI->bind_param("ssssi", $usuario, $email, $dni, $expediente, $id);
    } else {
        $stmtI = $conexion->prepare("UPDATE inscripciones SET email=?, dni=?, expediente=? WHERE id_usuario=?");
        $stmtI->bind_param("sssi", $email, $dni, $expediente, $id);
    }
    $stmtI->execute();

    json_exit(['ok' => true]);
}

/* =========================
   PARTICIPANTE
========================= */
$stmt = $conexion->prepare("
    SELECT usuario
    FROM participantes
    WHERE id_usuario = ?
    LIMIT 1
");
$stmt->bind_param("i", $id);
$stmt->execute();
$participante = $stmt->get_result()->fetch_assoc();

if (!$participante) {
    json_exit(['ok' => false, 'error' => 'Participante no encontrado']);
}

/* =========================
   INSCRIPCIONES (0..2)
========================= */
$tiene_motivo = column_exists($conexion, 'inscripciones', 'motivo_rechazo');
$tiene_nombre = column_exists($conexion, 'inscripciones', 'nombre_responsable');

$select_nombre = $tiene_nombre ? "nombre_responsable," : "";
$select_motivo = $tiene_motivo ? "motivo_rechazo," : "'' AS motivo_rechazo,";

$sql = "
    SELECT
        id_inscripcion,
        $select_nombre
        ficha,
        cartel,
        sinopsis,
        email,
        dni,
        expediente,
        video,
        estado,
        $select_motivo
        id_usuario
    FROM inscripciones
    WHERE id_usuario = ?
    ORDER BY id_inscripcion DESC
";

$stmt2 = $conexion->prepare($sql);
$stmt2->bind_param("i", $id);
$stmt2->execute();
$candidaturas = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);

$head = $candidaturas[0] ?? null;

json_exit([
    'ok' => true,
    'usuario' => $participante['usuario'],
    'email' => $head['email'] ?? '',
    'dni' => $head['dni'] ?? '',
    'expediente' => $head['expediente'] ?? '',
    'candidaturas' => $candidaturas
]);
