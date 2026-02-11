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

/* 12 usuarios demo */
insertarUsuario($conexion, "participantes", "alumno1", "1234");
insertarUsuario($conexion, "participantes", "alumno2", "1234");
insertarUsuario($conexion, "participantes", "alumno3", "1234");
insertarUsuario($conexion, "participantes", "alumno4", "1234");
insertarUsuario($conexion, "participantes", "alumno5", "1234");
insertarUsuario($conexion, "participantes", "alumno6", "1234");

insertarUsuario($conexion, "participantes", "alumni1", "1234");
insertarUsuario($conexion, "participantes", "alumni2", "1234");
insertarUsuario($conexion, "participantes", "alumni3", "1234");
insertarUsuario($conexion, "participantes", "alumni4", "1234");
insertarUsuario($conexion, "participantes", "alumni5", "1234");
insertarUsuario($conexion, "participantes", "alumni6", "1234");

/* Obtener IDs */
$ids = [];
$result = $conexion->query("SELECT id_usuario, usuario FROM participantes");
while ($row = $result->fetch_assoc()) {
    $ids[$row['usuario']] = $row['id_usuario'];
}

/* =======================
   12 INSCRIPCIONES DEMO (PROTEGIDAS)
======================= */

/* Comprobar si ya existen inscripciones */
$check = $conexion->query("SELECT COUNT(*) AS total FROM inscripciones");
$row = $check->fetch_assoc();

if ($row['total'] == 0) {

    $conexion->query("
    INSERT INTO inscripciones 
    (id_usuario, ficha, cartel, sinopsis, nombre_responsable, email, dni, expediente, video, tipo_participante, estado)
    VALUES

    ({$ids['alumno1']}, 'ficha1.pdf','cartel1.jpg','Un corto sobre la última luz del campus.','Carlos Martínez','carlos1@universidadeuropea.es','12345678A','EXP001','video1.mp4','Alumno','PENDIENTE'),

    ({$ids['alumno2']}, 'ficha2.pdf','cartel2.jpg','Documental sobre la vida universitaria desde dentro.','Lucía Fernández','lucia2@universidadeuropea.es','87654321B','EXP002','video2.mp4','Alumno','PENDIENTE'),

    ({$ids['alumno3']}, 'ficha3.pdf','cartel3.jpg','Animación sobre un personaje digital que cobra vida.','Marcos Ruiz','marcos3@universidadeuropea.es','11223344C','EXP003','video3.mp4','Alumno','PENDIENTE'),

    ({$ids['alumno4']}, 'ficha4.pdf','cartel4.jpg','Historia de ficción grabada en un solo plano secuencia.','Sara Gómez','sara4@universidadeuropea.es','44332211D','EXP004','video4.mp4','Alumno','PENDIENTE'),

    ({$ids['alumno5']}, 'ficha5.pdf','cartel5.jpg','Corto sobre la presión académica y la creatividad.','David López','david5@universidadeuropea.es','55667788E','EXP005','video5.mp4','Alumno','PENDIENTE'),

    ({$ids['alumno6']}, 'ficha6.pdf','cartel6.jpg','Una historia de amistad en el campus.','Elena Torres','elena6@universidadeuropea.es','99887766F','EXP006','video6.mp4','Alumno','PENDIENTE'),

    ({$ids['alumni1']}, 'ficha7.pdf','cartel7.jpg','Corto experimental sobre la saturación informativa.','Ana López','ana1@alumniuniversidadeuropea.es','11112222G','ALU001','video7.mp4','Alumni','PENDIENTE'),

    ({$ids['alumni2']}, 'ficha8.pdf','cartel8.jpg','Historia grabada en un solo plano secuencia.','Javier Ortega','javier2@alumniuniversidadeuropea.es','22223333H','ALU002','video8.mp4','Alumni','PENDIENTE'),

    ({$ids['alumni3']}, 'ficha9.pdf','cartel9.jpg','Dos historias paralelas que se cruzan en un instante.','Elena García','elena3@alumniuniversidadeuropea.es','33334444I','ALU003','video9.mp4','Alumni','PENDIENTE'),

    ({$ids['alumni4']}, 'ficha10.pdf','cartel10.jpg','Un thriller psicológico ambientado en la universidad.','Mario Sánchez','mario4@alumniuniversidadeuropea.es','44445555J','ALU004','video10.mp4','Alumni','PENDIENTE'),

    ({$ids['alumni5']}, 'ficha11.pdf','cartel11.jpg','Corto sobre el paso del tiempo y la memoria.','Paula Díaz','paula5@alumniuniversidadeuropea.es','55556666K','ALU005','video11.mp4','Alumni','PENDIENTE'),

    ({$ids['alumni6']}, 'ficha12.pdf','cartel12.jpg','Un documental sobre la evolución del campus.','Roberto Martín','roberto6@alumniuniversidadeuropea.es','66667777L','ALU006','video12.mp4','Alumni','PENDIENTE');
    ");

}


?>
