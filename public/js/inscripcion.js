document.addEventListener("DOMContentLoaded", () => {

    fetch("../../app/controllers/InscripcionController.php?accion=estado")
        .then(r => r.json())
        .then(data => {
            if (data.tieneSesion) {
                document.getElementById("datosUsuario").style.display = "none";
            }
            if (data.total >= 2) {
                window.location.href = "index.html";
            }
        });
});

document.getElementById("formInscripcion").addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(e.target);

    fetch("../../app/controllers/InscripcionController.php", {
        method: "POST",
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) {
            window.location.href = "perfil.html";
        } else {
            document.getElementById("mensaje").innerText = data.error;
        }
    })
    .catch(() => {
        document.getElementById("mensaje").innerText = "Error al enviar la inscripción";
    });
});
