<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require "../../config/database.php";

ini_set('display_errors', 0);
error_reporting(E_ALL);

function json_exit($arr) {
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

$accion = $_GET['accion'] ?? $_POST['accion'] ?? null;

/* ======================================================
   DEFINICIÓN PREMIOS FIJOS
====================================================== */
$PREMIOS = [
    'UE' => [
        'tipo' => 'Alumno',
        'puestos' => ['PRIMERO', 'SEGUNDO', 'TERCERO']
    ],
    'ALUMNI' => [
        'tipo' => 'Alumni',
        'puestos' => ['PRIMERO', 'SEGUNDO']
    ]
];

/* ======================================================
   PUBLICO – PREMIOS + GANADORES + HONORÍFICO
====================================================== */
if ($accion === 'publico') {

    $stmt = $conexion->query("
        SELECT g.premio, g.puesto, i.nombre_responsable
        FROM premios_ganadores g
        JOIN inscripciones i ON i.id_inscripcion = g.id_inscripcion
    ");

    $rows = $stmt ? $stmt->fetch_all(MYSQLI_ASSOC) : [];

    $ganadores = [
        'UE' => ['PRIMERO'=>null,'SEGUNDO'=>null,'TERCERO'=>null],
        'ALUMNI' => ['PRIMERO'=>null,'SEGUNDO'=>null]
    ];

    foreach ($rows as $r) {
        $ganadores[$r['premio']][$r['puesto']] = $r['nombre_responsable'];
    }

    $hon = $conexion->query("SELECT * FROM premio_honorifico WHERE id=1")->fetch_assoc();

    json_exit([
        'ok' => true,
        'ganadores' => $ganadores,
        'honorifico' => $hon
    ]);
}

/* ======================================================
   PUBLICO – HONORÍFICO
====================================================== */
if ($accion === 'honorifico_get') {
    $hon = $conexion->query("SELECT * FROM premio_honorifico WHERE id=1")->fetch_assoc();
    json_exit(['ok'=>true,'honorifico'=>$hon]);
}

/* ======================================================
   REQUIERE ORGANIZADOR
====================================================== */
if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
    json_exit(['ok'=>false,'error'=>'No autorizado']);
}

/* ======================================================
   ORGANIZADOR – PREMIOS ASIGNADOS
====================================================== */
if ($accion === 'asignados') {

    $stmt = $conexion->query("
        SELECT g.premio, g.puesto, i.nombre_responsable
        FROM premios_ganadores g
        JOIN inscripciones i ON i.id_inscripcion = g.id_inscripcion
        ORDER BY g.premio, g.puesto
    ");

    $rows = $stmt ? $stmt->fetch_all(MYSQLI_ASSOC) : [];

    $hon = $conexion->query("SELECT * FROM premio_honorifico WHERE id=1")->fetch_assoc();

    json_exit([
        'ok' => true,
        'asignados' => $rows,
        'honorifico' => $hon
    ]);
}

/* ======================================================
   ORGANIZADOR – NOMINADOS DISPONIBLES
====================================================== */
if ($accion === 'nominados') {

    $premio = $_GET['premio'] ?? '';
    if (!isset($PREMIOS[$premio])) {
        json_exit(['ok'=>false,'error'=>'Premio inválido']);
    }

    $tipo = $PREMIOS[$premio]['tipo'];

    $stmt = $conexion->prepare("
        SELECT id_inscripcion, nombre_responsable
        FROM inscripciones
        WHERE estado='NOMINADO'
          AND tipo_participante=?
          AND id_inscripcion NOT IN (
            SELECT id_inscripcion FROM premios_ganadores
          )
        LIMIT 5
    ");
    $stmt->bind_param("s", $tipo);
    $stmt->execute();

    json_exit([
        'ok'=>true,
        'nominados'=>$stmt->get_result()->fetch_all(MYSQLI_ASSOC)
    ]);
}

/* ======================================================
   ORGANIZADOR – ASIGNAR PREMIO
====================================================== */
if ($accion === 'asignar') {

    $premio = $_POST['premio'] ?? '';
    $puesto = $_POST['puesto'] ?? '';
    $id = intval($_POST['id_inscripcion'] ?? 0);

    if (!isset($PREMIOS[$premio]) || !$id) {
        json_exit(['ok'=>false,'error'=>'Datos inválidos']);
    }

    $stmt = $conexion->prepare("
        INSERT INTO premios_ganadores (premio, puesto, id_inscripcion)
        VALUES (?,?,?)
    ");
    $stmt->bind_param("ssi", $premio, $puesto, $id);
    $stmt->execute();

    json_exit(['ok'=>true]);
}

/* ======================================================
   ORGANIZADOR – GUARDAR HONORÍFICO (ÚNICO)
====================================================== */
if ($accion === 'honorifico_save') {

    $nombre = trim($_POST['nombre'] ?? '');
    $desc = trim($_POST['descripcion'] ?? '');
    $link = trim($_POST['enlace'] ?? '');

    if ($nombre === '' || $desc === '') {
        json_exit(['ok'=>false,'error'=>'Nombre y descripción obligatorios']);
    }

    $stmt = $conexion->prepare("
        INSERT INTO premio_honorifico (id, nombre, descripcion, enlace)
        VALUES (1,?,?,?)
        ON DUPLICATE KEY UPDATE
            nombre=VALUES(nombre),
            descripcion=VALUES(descripcion),
            enlace=VALUES(enlace)
    ");
    $stmt->bind_param("sss", $nombre, $desc, $link);
    $stmt->execute();

    json_exit(['ok'=>true]);
}

json_exit(['ok'=>false,'error'=>'Acción inválida']);
