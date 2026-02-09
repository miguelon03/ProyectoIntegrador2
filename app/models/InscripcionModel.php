<?php

class InscripcionModel {

    private $db;

    public function __construct($conexion) {
        $this->db = $conexion;
    }

    public function listarTodas() {
        $res = $this->db->query("
            SELECT i.*, u.nombre AS usuario
            FROM inscripciones i
            LEFT JOIN usuarios u ON u.id_usuario = i.id_usuario
            ORDER BY i.fecha_creacion DESC
        ");
        return $res->fetch_all(MYSQLI_ASSOC);
    }

    public function aceptar($id) {
        $stmt = $this->db->prepare("
            UPDATE inscripciones SET estado='aceptada'
            WHERE id_inscripcion=?
        ");
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }

    public function rechazar($id) {
        $stmt = $this->db->prepare("
            UPDATE inscripciones SET estado='rechazada'
            WHERE id_inscripcion=?
        ");
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }
}
