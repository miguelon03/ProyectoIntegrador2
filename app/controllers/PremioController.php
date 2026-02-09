<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require "../../config/database.php";

/* Evita que warnings/errores HTML rompan el JSON */
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function json_exit($arr) {
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

$accion = $_GET['accion'] ?? $_POST['accion'] ?? '';

function require_organizador() {
    if (!isset($_SESSION['tipo']) || $_SESSION['tipo'] !== 'organizador') {
        json_exit(['ok' => false, 'error' => 'No autorizado']);
    }
}

/* =========================
   HELPERS: ¿existe columna?
========================= */
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

/* ======================================================
   LISTAR CATEGORÍAS + GANADORES (ORGANIZADOR)
====================================================== */
if ($accion === 'listar') {
    require_organizador();

    $tiene_puesto = column_exists($conexion, 'premios_ganadores', 'puesto');

    if ($tiene_puesto) {
        $sql = "
            SELECT 
                p.id_premio,
                p.nombre,
                p.descripcion,
                MAX(CASE WHEN pg.puesto='PRIMERO' THEN pg.id_inscripcion END) AS ganador_primero_id,
                MAX(CASE WHEN pg.puesto='SEGUNDO' THEN pg.id_inscripcion END) AS ganador_segundo_id,
                MAX(CASE WHEN pg.puesto='PRIMERO' THEN COALESCE(i.nombre_responsable, pa.usuario) END) AS ganador_primero,
                MAX(CASE WHEN pg.puesto='SEGUNDO' THEN COALESCE(i.nombre_responsable, pa.usuario) END) AS ganador_segundo
            FROM premios p
            LEFT JOIN premios_ganadores pg ON pg.id_premio = p.id_premio
            LEFT JOIN inscripciones i ON i.id_inscripcion = pg.id_inscripcion
            LEFT JOIN participantes pa ON pa.id_usuario = i.id_usuario
            GROUP BY p.id_premio
            ORDER BY p.id_premio DESC
        ";
        $res = $conexion->query($sql);
        json_exit(['ok' => true, 'premios' => $res->fetch_all(MYSQLI_ASSOC)]);
    } else {
        $sql = "
            SELECT 
                p.id_premio,
                p.nombre,
                p.descripcion,
                GROUP_CONCAT(DISTINCT COALESCE(i.nombre_responsable, pa.usuario) SEPARATOR ', ') AS ganadores
            FROM premios p
            LEFT JOIN premios_ganadores pg ON pg.id_premio = p.id_premio
            LEFT JOIN inscripciones i ON i.id_inscripcion = pg.id_inscripcion
            LEFT JOIN participantes pa ON pa.id_usuario = i.id_usuario
            GROUP BY p.id_premio
            ORDER BY p.id_premio DESC
        ";
        $res = $conexion->query($sql);
        json_exit(['ok' => true, 'premios' => $res->fetch_all(MYSQLI_ASSOC)]);
    }
}

/* ======================================================
   LISTAR NOMINADOS (ORGANIZADOR)
   - EXCLUYE los que ya tienen un premio asignado
====================================================== */
if ($accion === 'nominados') {
    require_organizador();

    $res = $conexion->query("
        SELECT 
            i.id_inscripcion,
            COALESCE(i.nombre_responsable, p.usuario) AS usuario,
            i.estado
        FROM inscripciones i
        LEFT JOIN participantes p ON p.id_usuario = i.id_usuario
        WHERE UPPER(i.estado) = 'NOMINADO'
          AND i.id_inscripcion NOT IN (SELECT id_inscripcion FROM premios_ganadores)
        ORDER BY i.id_inscripcion DESC
    ");

    json_exit(['ok' => true, 'nominados' => $res->fetch_all(MYSQLI_ASSOC)]);
}

/* ======================================================
   CREAR CATEGORÍA (ORGANIZADOR)
====================================================== */
if ($accion === 'crear') {
    require_organizador();

    $nombre = trim($_POST['nombre'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');

    if ($nombre === '') {
        json_exit(['ok' => false, 'error' => 'El nombre es obligatorio']);
    }

    $stmt = $conexion->prepare("
        INSERT INTO premios (nombre, descripcion)
        VALUES (?, ?)
    ");
    $stmt->bind_param("ss", $nombre, $descripcion);
    $stmt->execute();

    json_exit(['ok' => true]);
}

/* ======================================================
   ASIGNAR PREMIO (ORGANIZADOR)
   - Soporta puesto PRIMERO/SEGUNDO si existe columna
   - No permite repetir ganador por puesto en la categoría
   - No permite que una inscripción gane 2 premios
====================================================== */
if ($accion === 'asignar') {
    require_organizador();

    $id_premio = intval($_POST['id_premio'] ?? 0);
    $id_inscripcion = intval($_POST['id_inscripcion'] ?? 0);
    $puesto = strtoupper(trim($_POST['puesto'] ?? 'PRIMERO'));

    if (!$id_premio || !$id_inscripcion) {
        json_exit(['ok' => false, 'error' => 'Datos incompletos']);
    }

    // Solo permitir asignar a NOMINADO
    $chk = $conexion->query("
        SELECT estado FROM inscripciones 
        WHERE id_inscripcion = $id_inscripcion
        LIMIT 1
    ")->fetch_assoc();

    if (!$chk || strtoupper($chk['estado']) !== 'NOMINADO') {
        json_exit(['ok' => false, 'error' => 'Solo se puede asignar premio a NOMINADOS']);
    }

    // Evitar que una misma inscripción reciba varios premios (en cualquier categoría)
    $stmt = $conexion->prepare("SELECT COUNT(*) c FROM premios_ganadores WHERE id_inscripcion = ?");
    $stmt->bind_param("i", $id_inscripcion);
    $stmt->execute();
    $yaTiene = intval($stmt->get_result()->fetch_assoc()['c'] ?? 0);

    if ($yaTiene > 0) {
        json_exit(['ok' => false, 'error' => 'Error: este premio ya está asignado']);
    }

    $tiene_puesto = column_exists($conexion, 'premios_ganadores', 'puesto');

    if ($tiene_puesto) {
        // No permitir duplicar mismo puesto en la misma categoría
        $stmt = $conexion->prepare("
            SELECT COUNT(*) c
            FROM premios_ganadores
            WHERE id_premio = ? AND puesto = ?
        ");
        $stmt->bind_param("is", $id_premio, $puesto);
        $stmt->execute();
        $c = intval($stmt->get_result()->fetch_assoc()['c'] ?? 0);

        if ($c > 0) {
            json_exit(['ok' => false, 'error' => "Error: este premio ya está asignado"]);
        }

        $stmt = $conexion->prepare("
            INSERT INTO premios_ganadores (id_premio, id_inscripcion, puesto)
            VALUES (?,?,?)
        ");
        $stmt->bind_param("iis", $id_premio, $id_inscripcion, $puesto);
        $stmt->execute();
    } else {
        // Fallback si tu tabla NO tiene columna puesto
        $stmt = $conexion->prepare("
            INSERT INTO premios_ganadores (id_premio, id_inscripcion)
            VALUES (?,?)
        ");
        $stmt->bind_param("ii", $id_premio, $id_inscripcion);
        $stmt->execute();
    }

    json_exit(['ok' => true]);
}

json_exit(['ok' => false, 'error' => 'Acción inválida']);
