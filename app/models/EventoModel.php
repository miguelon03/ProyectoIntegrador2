<?php

class EventoModel {

    private $db;

    public function __construct($conexion) {
        $this->db = $conexion;
    }

    public function listar() {
        $res = $this->db->query("SELECT * FROM eventos ORDER BY fecha, hora");
        return $res->fetch_all(MYSQLI_ASSOC);
    }

    public function crear($data) {
        $stmt = $this->db->prepare("
            INSERT INTO eventos (titulo, descripcion, fecha, hora)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param(
            "ssss",
            $data['titulo'],
            $data['descripcion'],
            $data['fecha'],
            $data['hora']
        );
        return $stmt->execute();
    }

    public function editar($id, $data) {
        $stmt = $this->db->prepare("
            UPDATE eventos
            SET titulo=?, descripcion=?, fecha=?, hora=?
            WHERE id_evento=?
        ");
        $stmt->bind_param(
            "ssssi",
            $data['titulo'],
            $data['descripcion'],
            $data['fecha'],
            $data['hora'],
            $id
        );
        return $stmt->execute();
    }

    public function borrar($id) {
        $stmt = $this->db->prepare("DELETE FROM eventos WHERE id_evento=?");
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }
}
