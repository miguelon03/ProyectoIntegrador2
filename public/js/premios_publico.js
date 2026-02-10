fetch("/ProyectoIntegrador2/app/controllers/PremioController.php?accion=honorifico_get")
    .then(r => r.json())
    .then(data => {
        if (!data.ok) return;

        const cont = document.getElementById("honorificoPublico");
        if (!cont) return;

        if (!data.honorifico) {
            cont.textContent = "Pendiente de anunciar";
            return;
        }

        cont.innerHTML = `
            <strong>${data.honorifico.nombre}</strong><br>
            ${data.honorifico.descripcion}<br>
            ${data.honorifico.enlace
                ? `<a href="${data.honorifico.enlace}" target="_blank">Más información</a>`
                : ""
            }
        `;
    });
