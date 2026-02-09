<?php

class NoticiaModel {

    private $db;

    public function __construct($conexion) {
        $this->db = $conexion;
    }

    public function listar() {
        $res = $this->db->query("
            SELECT * FROM noticias
            ORDER BY fecha DESC
        ");
        return $res->fetch_all(MYSQLI_ASSOC);
    }

    public function crear($data) {
        $stmt = $this->db->prepare("
            INSERT INTO noticias (titulo, descripcion, fecha)
            VALUES (?, ?, CURDATE())
        ");
        $stmt->bind_param("ss", $data['titulo'], $data['descripcion']);
        return $stmt->execute();
    }

    public function editar($id, $data) {
        $stmt = $this->db->prepare("
            UPDATE noticias
            SET titulo=?, descripcion=?
            WHERE id_noticia=?
        ");
        $stmt->bind_param("ssi",
            $data['titulo'],
            $data['descripcion'],
            $id
        );
        return $stmt->execute();
    }

    public function borrar($id) {
        $stmt = $this->db->prepare("
            DELETE FROM noticias WHERE id_noticia=?
        ");
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }
}
