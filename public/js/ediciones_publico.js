function _formatearFecha(fechaSql) {
    if (!fechaSql) return "";

    // MySQL suele devolver "YYYY-MM-DD" o "YYYY-MM-DD HH:MM:SS".
    // Safari se queja del formato con espacio, por eso normalizamos.
    const normalizada = String(fechaSql).replace(" ", "T");
    const d = new Date(normalizada);

    if (isNaN(d.getTime())) {
        // Si el navegador no puede parsear, mostramos el string tal cual.
        return String(fechaSql);
    }
    return d.toLocaleDateString();
}

fetch("/ProyectoIntegrador2/app/controllers/EdicionesPublicController.php")
    .then(r => r.json())
    .then(data => {
        const cont = document.getElementById("listaEdiciones");
        if (!cont) return;

        cont.innerHTML = "";

        if (!data || !data.ok) {
            cont.innerHTML = `<p>No se pudieron cargar las ediciones.</p>`;
            return;
        }

        const ediciones = Array.isArray(data.ediciones) ? data.ediciones : [];

        if (ediciones.length === 0) {
            cont.innerHTML = `<p>Todavía no hay ediciones anteriores publicadas.</p>`;
            return;
        }

        ediciones.forEach(e => {
            const anio = e.anio ?? "";
            const fecha = _formatearFecha(e.fecha);
            const texto = e.texto_resumen ?? "";
            const imagenes = Array.isArray(e.imagenes) ? e.imagenes : [];

            cont.innerHTML += `
                <section class="bloque">
                    <h2>Edición ${anio}</h2>
                    <p class="fecha-edicion">${fecha}</p>

                    <p>${texto}</p>

                    <div class="bloques">
                        ${imagenes.map(img =>
                            `<img src="../../uploads/${img.ruta}" alt="Imagen edición ${anio}">`
                        ).join("")}
                    </div>
                </section>
            `;
        });
    })
    .catch(err => {
        console.error("Error cargando ediciones:", err);
        const cont = document.getElementById("listaEdiciones");
        if (cont) cont.innerHTML = `<p>Error cargando ediciones. Revisa la consola del navegador.</p>`;
    });
