document.addEventListener("DOMContentLoaded", () => {

    function mostrarSeccion(id) {
        document.querySelectorAll("main section").forEach(s =>
            s.classList.remove("activa")
        );

        const seccion = document.getElementById(id);
        if (!seccion) return;

        seccion.classList.add("activa");

        if (id === "candidaturas" && typeof cargarCandidaturas === "function") {
            cargarCandidaturas();
        }

        if (id === "eventos" && typeof cargarEventos === "function") {
            cargarEventos();
        }

        if (id === "noticias" && typeof cargarNoticias === "function") {
            cargarNoticias();
        }

        if (id === "premios" && typeof cargarPremios === "function") {
            cargarPremios();
        }

        if (id === "patrocinadores" && typeof cargarPatrocinadores === "function") {
            cargarPatrocinadores();
        }

        if (id === "gala" && typeof cargarModo === "function") {
            cargarModo();
        }
    }

    window.mostrarSeccion = mostrarSeccion;

    const menuToggle = document.getElementById("menuToggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            document.getElementById("navLinks")?.classList.toggle("open");
        });
    }

    // Cargar por defecto candidaturas
    mostrarSeccion("candidaturas");
});

/* =========================
   GALA
========================= */
const BASE_URL_GALA = "/ProyectoIntegrador2/app/controllers/GalaController.php";

/* Cargar modo PRE / POST */
function cargarModo() {
    fetch(`${BASE_URL_GALA}?accion=estado`, { credentials: "same-origin" })
        .then(r => r.json())
        .then(data => {
            if (!data.ok) return;

            document.getElementById("modoActual").innerText = data.modo;

            const galaPre = document.getElementById("galaPre");
            const galaPost = document.getElementById("galaPost");

            if (data.modo === "PRE") {
                galaPre.style.display = "block";
                galaPost.style.display = "none";
                cargarSecciones();
            } else {
                galaPre.style.display = "none";
                galaPost.style.display = "block";
                cargarImagenesPost(); // 🔥 CLAVE
            }
        })
        .catch(() => mostrarModalError("Error al cargar modo de gala"));
}

/* Cambiar modo */
function cambiarModo() {
    fetch(`${BASE_URL_GALA}?accion=cambiarModo`, { credentials: "same-origin" })
        .then(r => r.json())
        .then(data => {
            if (data.ok) cargarModo();
            else mostrarModalError(data.error);
        });
}

/* =========================
   SECCIONES PRE-GALA
========================= */
function cargarSecciones() {
    fetch(`${BASE_URL_GALA}?accion=listarSecciones`)
        .then(r => r.json())
        .then(data => {
            const cont = document.getElementById("listaSecciones");
            cont.innerHTML = "";

            if (!data.secciones.length) {
                cont.innerHTML = "<p>No hay secciones</p>";
                return;
            }

            data.secciones.forEach(s => {
                cont.innerHTML += `
                    <div>
                        <b>${s.titulo}</b> – ${s.hora} – ${s.sala}
                        <button onclick="borrarSeccion(${s.id_seccion})">🗑️</button>
                    </div>
                `;
            });
        });
}

function borrarSeccion(id) {
    if (!confirm("¿Eliminar sección?")) return;
    fetch(`${BASE_URL_GALA}?accion=borrarSeccion&id=${id}`)
        .then(() => cargarSecciones());
}

/* =========================
   POST-GALA – IMÁGENES
========================= */
const formImagen = document.getElementById("formImagen");
if (formImagen) {
    formImagen.addEventListener("submit", e => {
        e.preventDefault();
        const formData = new FormData(formImagen);

        fetch(`${BASE_URL_GALA}?accion=subirImagen`, {
            method: "POST",
            body: formData
        })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                formImagen.reset();
                cargarImagenesPost();
            } else mostrarModalError(data.error);
        });
    });
}

function cargarImagenesPost() {
    fetch(`${BASE_URL_GALA}?accion=listarImagenes`)
        .then(r => r.json())
        .then(data => {
            const cont = document.getElementById("galeriaPost");
            cont.innerHTML = "";

            data.imagenes.forEach(img => {
                cont.innerHTML += `
                    <div style="display:inline-block;margin:10px">
                        <img src="../../uploads/${img.ruta}" width="150"><br>
                        <button onclick="borrarImagen(${img.id})">Eliminar</button>
                    </div>
                `;
            });
        });
}

function borrarImagen(id) {
    if (!confirm("¿Eliminar imagen?")) return;
    fetch(`${BASE_URL_GALA}?accion=borrarImagen&id=${id}`)
        .then(() => cargarImagenesPost());
}

/* =========================
   GUARDAR EDICIÓN
========================= */
function guardarEdicion() {
    if (!confirm("¿Guardar como edición anterior?")) return;
    fetch(`${BASE_URL_GALA}?accion=guardarEdicion`)
        .then(r => r.json())
        .then(() => mostrarModalError("Edición guardada correctamente"));
}

