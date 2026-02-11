<?php

$DB_HOST = "localhost";
$DB_USER = "root";
$DB_PASS = "";
$DB_NAME = "ProyectoIntegrador";

$conexion = new mysqli($DB_HOST, $DB_USER, $DB_PASS);

if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

// Crear BD si no existe
$conexion->query("CREATE DATABASE IF NOT EXISTS $DB_NAME");
$conexion->select_db($DB_NAME);

// =======================
// CREACIÓN DE TABLAS
// =======================
$sql = "

CREATE TABLE IF NOT EXISTS participantes (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    contrasena VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS organizadores (
    id_organizador INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    contrasena VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS noticias (
    id_noticia INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eventos (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS premios (
    id_premio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS inscripciones (
    id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    ficha VARCHAR(255),
    cartel VARCHAR(255),
    sinopsis TEXT,
    nombre_responsable VARCHAR(150),
    email VARCHAR(150),
    dni VARCHAR(20),
    expediente VARCHAR(255),
    video VARCHAR(255),

    tipo_participante ENUM('Alumno','Alumni') NOT NULL,

    estado ENUM('PENDIENTE','RECHAZADO','ACEPTADO','NOMINADO') DEFAULT 'PENDIENTE',
    motivo_rechazo TEXT,
    mensaje_subsanacion TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS premios_ganadores (
    id_ganador INT AUTO_INCREMENT PRIMARY KEY,

    premio VARCHAR(32) NOT NULL
        COMMENT 'UE | ALUMNI',

    puesto VARCHAR(16) NOT NULL
        COMMENT 'PRIMERO | SEGUNDO | TERCERO',

    id_inscripcion INT NOT NULL,

    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_premio_inscripcion
        FOREIGN KEY (id_inscripcion)
        REFERENCES inscripciones(id_inscripcion)
        ON DELETE CASCADE,

    CONSTRAINT uq_premio_puesto
        UNIQUE (premio, puesto),

    CONSTRAINT uq_inscripcion_unica
        UNIQUE (id_inscripcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gala (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modo ENUM('PRE','POST') DEFAULT 'PRE',
    texto_resumen TEXT,
    fecha_edicion DATE
);

CREATE TABLE IF NOT EXISTS gala_secciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255),
    hora TIME,
    sala VARCHAR(100),
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS gala_imagenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ruta VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS ediciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ediciones_imagenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_edicion INT,
    ruta VARCHAR(255),
    FOREIGN KEY (id_edicion) REFERENCES ediciones(id) ON DELETE CASCADE
);

INSERT INTO gala (id, modo)
SELECT 1, 'PRE'
WHERE NOT EXISTS (SELECT 1 FROM gala WHERE id = 1);

CREATE TABLE IF NOT EXISTS patrocinadores (
    id_patrocinador INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    logo VARCHAR(255) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS premio_honorifico (
  id INT PRIMARY KEY DEFAULT 1,
  nombre VARCHAR(255),
  descripcion TEXT,
  enlace VARCHAR(1024)
);

";

if (!$conexion->multi_query($sql)) {
    die("Error creando tablas: " . $conexion->error);
}

while ($conexion->next_result()) {;}

/* =======================
   FUNCIÓN PARA INSERTAR USUARIOS (HASH)
======================= */
function insertarUsuario($conexion, $tabla, $usuario, $passwordPlano)
{
    $hash = password_hash($passwordPlano, PASSWORD_DEFAULT);

    $stmt = $conexion->prepare("
        INSERT INTO $tabla (usuario, contrasena)
        SELECT ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM $tabla WHERE usuario = ?
        )
    ");

    if ($stmt) {
        $stmt->bind_param("sss", $usuario, $hash, $usuario);
        $stmt->execute();
        $stmt->close();
    }
}

/* =======================
   USUARIOS INICIALES
======================= */

insertarUsuario($conexion, "organizadores", "miguel", "3333");

