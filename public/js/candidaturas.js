const URL_INS = "../../app/controllers/InscripcionController.php";

document.addEventListener("DOMContentLoaded", () => {

    window.cargarCandidaturas = function () {
        const cont = document.getElementById("listaCandidaturas");
        if (!cont) return;

        fetch(`${URL_INS}?accion=listar`, { credentials: "same-origin" })
            .then(r => r.json())
            .then(data => {
                cont.innerHTML = "";

                if (!data.ok || !data.candidaturas.length) {
                    cont.innerHTML = "<p>No hay candidaturas</p>";
                    return;
                }

                data.candidaturas.forEach(c => {
                    cont.innerHTML += `
                        <div class="news-card">
                            <h3>Candidatura</h3>
                            <p><strong>Usuario:</strong> ${c.usuario}</p>
                            <p><strong>Estado:</strong> ${c.estado}</p>

                            <div class="news-actions">
                                ${c.estado === "PENDIENTE" ? `
                                    <button onclick="aceptarCandidatura(${c.id_inscripcion})">✔</button>
                                    <button onclick="rechazarCandidatura(${c.id_inscripcion})">✖</button>
                                ` : ""}

                                ${c.estado === "ACEPTADO" ? `
                                    <button onclick="nominarCandidatura(${c.id_inscripcion})">🏆 Nominar</button>
                                ` : ""}
                            </div>
                        </div>
                    `;
                });
            })
            .catch(err => {
                console.error(err);
                cont.innerHTML = "<p>Error al cargar candidaturas</p>";
            });
    };

    window.aceptarCandidatura = id => {
        fetch(`${URL_INS}?accion=aceptar&id=${id}`, { credentials: "same-origin" })
            .then(() => cargarCandidaturas());
    };

    window.nominarCandidatura = id => {
        fetch(`${URL_INS}?accion=nominar&id=${id}`, { credentials: "same-origin" })
            .then(() => cargarCandidaturas());
    };

    window.rechazarCandidatura = id => {
        const motivo = prompt("Motivo del rechazo:");
        if (!motivo) return;

        fetch(`${URL_INS}?accion=rechazar`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `id=${id}&motivo=${encodeURIComponent(motivo)}`
        }).then(() => cargarCandidaturas());
    };
});
