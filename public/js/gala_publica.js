const GALA_URL = "/ProyectoIntegrador2/app/controllers/GalaPublicController.php";



document.addEventListener("DOMContentLoaded", () => {
    fetch(`${GALA_URL}?accion=publico`)

        .then(r => r.json())
        .then(data => {
            if (!data.ok) return;

           if (data.modo === "PRE") {
    document.getElementById("galaPostPublico").style.display = "none";
    document.getElementById("galaPrePublico").style.display = "block";

    const fecha = document.getElementById("fechaGalaPublica");
    if (fecha && data.fecha) {
        fecha.innerText = data.fecha;
    }

    const cont = document.getElementById("programaGala");
    cont.innerHTML = "";

    data.secciones.forEach(s => {
        cont.innerHTML += `
            <div class="event-card">
                <div class="event-info">
                    <h3>${s.titulo}</h3>
                    <p>${s.descripcion}</p>
                    <small>${s.hora} · ${s.sala}</small>
                </div>
            </div>
        `;
    });
}


            if (data.modo === "POST") {
                document.getElementById("galaPrePublico").style.display = "none";
                document.getElementById("galaPostPublico").style.display = "block";

                document.getElementById("textoResumen").innerText = data.texto || "";

                const galeria = document.getElementById("galeria");
                galeria.innerHTML = "";

                data.imagenes.forEach(img => {
                    galeria.innerHTML += `
                        <div class="bloque">
                            <img src="../../uploads/${img.ruta}" style="width:100%">
                        </div>
                    `;
                });
            }
        });
});
