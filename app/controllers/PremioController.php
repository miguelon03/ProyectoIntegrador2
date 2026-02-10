<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require "../../config/database.php";

ini_set('display_errors', 1);
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
   LISTAR NOMINADOS DISPONIBLES
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
    ");
    $stmt->bind_param("s", $tipo);
    $stmt->execute();

    json_exit([
        'ok'=>true,
        'nominados'=>$stmt->get_result()->fetch_all(MYSQLI_ASSOC)
    ]);
}

/* ======================================================
   ASIGNAR PREMIO
====================================================== */
if ($accion === 'asignar') {

    $premio = $_POST['premio'] ?? '';
    $puesto = $_POST['puesto'] ?? '';
    $id = intval($_POST['id_inscripcion'] ?? 0);

    if (!isset($PREMIOS[$premio])) {
        json_exit(['ok'=>false,'error'=>'Premio inválido']);
    }
    if (!in_array($puesto, $PREMIOS[$premio]['puestos'], true)) {
        json_exit(['ok'=>false,'error'=>'Puesto inválido']);
    }
    if (!$id) {
        json_exit(['ok'=>false,'error'=>'ID inválido']);
    }

    // Comprobar tipo participante
    $stmt = $conexion->prepare("SELECT tipo_participante FROM inscripciones WHERE id_inscripcion=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $tipoReal = $stmt->get_result()->fetch_row()[0] ?? null;

    if ($tipoReal !== $PREMIOS[$premio]['tipo']) {
        json_exit(['ok'=>false,'error'=>'Tipo de candidatura no válido']);
    }

    // Comprobar puesto libre
    $stmt = $conexion->prepare("SELECT 1 FROM premios_ganadores WHERE premio=? AND puesto=?");
    $stmt->bind_param("ss", $premio, $puesto);
    $stmt->execute();
    if ($stmt->get_result()->fetch_row()) {
        json_exit(['ok'=>false,'error'=>'Ese puesto ya está asignado']);
    }

    // Insertar
    $stmt = $conexion->prepare("
        INSERT INTO premios_ganadores (premio, puesto, id_inscripcion)
        VALUES (?,?,?)
    ");
    $stmt->bind_param("ssi", $premio, $puesto, $id);
    $stmt->execute();

    json_exit(['ok'=>true]);
}

/* ======================================================
   GUARDAR / EDITAR PREMIO HONORÍFICO (ÚNICO)
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
/* ======================================================
   ORGANIZADOR – LISTAR PREMIOS ASIGNADOS
====================================================== */
if ($accion === 'asignados') {

    $stmt = $conexion->prepare("
        SELECT 
            g.premio,
            g.puesto,
            g.id_inscripcion,
            i.nombre_responsable,
            i.tipo_participante
        FROM premios_ganadores g
        JOIN inscripciones i ON i.id_inscripcion = g.id_inscripcion
        ORDER BY 
            FIELD(g.premio,'UE','ALUMNI'),
            FIELD(g.puesto,'PRIMERO','SEGUNDO','TERCERO')
    ");
    $stmt->execute();

    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Honorífico (si existe)
    $hon = $conexion->query("SELECT * FROM premio_honorifico WHERE id=1")->fetch_assoc();

    json_exit([
        'ok' => true,
        'asignados' => $rows,
        'honorifico' => $hon
    ]);
}

json_exit(['ok'=>false,'error'=>'Acción inválida']);
