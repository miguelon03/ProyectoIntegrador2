fetch("/ProyectoIntegrador2/app/controllers/PerfilController.php", {
    credentials: "same-origin"
})
    .then(r => r.json())
    .then(data => {
        if (!data.ok) {
            alert("No autorizado");
            return;
        }

        /* =====================
           DATOS PERSONALES
        ===================== */
        const datos = document.getElementById("datosPersonales");
        datos.innerHTML = `
            <li><strong>Usuario:</strong> ${data.usuario}</li>
            <li><strong>Email:</strong> ${data.email}</li>
            <li><strong>DNI:</strong> ${data.dni}</li>
            <li><strong>Expediente:</strong> ${data.expediente}</li>
        `;

        /* =====================
           CANDIDATURAS
        ===================== */
        const cont = document.getElementById("misCandidaturas");

        if (!data.candidaturas || data.candidaturas.length === 0) {
            cont.innerHTML = "<p>No tienes candidaturas.</p>";
            return;
        }


        data.candidaturas.forEach(c => {
            cont.innerHTML += `
                <div class="candidatura-card">
                    <p><strong>Estado:</strong> 
                        <span class="estado ${c.estado.toLowerCase()}">
                            ${c.estado}
                        </span>
                    </p>

                    <p>
                        <strong>Vídeo:</strong>
                        <a href="${c.video}" target="_blank">
                            Ver vídeo
                        </a>
                    </p>
                </div>
            `;
        });
    })
    .catch(err => {
        console.error(err);
        alert("Error al cargar el perfil");
    });
