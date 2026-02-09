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
   devolvemos todo para el modal
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

/* Datos personales: si tienes 2 inscripciones, email/dni/expediente puede variar.
   Para la cabecera mostramos los del primer registro si existe. */
$head = $candidaturas[0] ?? null;

json_exit([
    'ok' => true,
    'usuario' => $participante['usuario'],
    'email' => $head['email'] ?? '',
    'dni' => $head['dni'] ?? '',
    'expediente' => $head['expediente'] ?? '',
    'candidaturas' => $candidaturas
]);
