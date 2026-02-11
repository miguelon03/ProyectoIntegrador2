

fetch("/ProyectoIntegrador2/app/controllers/EdicionesPublicController.php")
.then(r=>r.json())
.then(data=>{
    const cont = document.getElementById("listaEdiciones");
    data.ediciones.forEach(e=>{
        cont.innerHTML += `
            <section class="bloque">
                <h2>Edición ${e.fecha}</h2>
                <p>${e.texto_resumen}</p>
                <div class="bloques">
                    ${e.imagenes.map(img =>
                        `<img src="../../uploads/${img.ruta}" style="width:100%">`
                    ).join("")}
                </div>
            </section>
        `;
    });
});
