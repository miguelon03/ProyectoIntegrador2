/* =========================
   INICIO – CARGA Y NAVEGACIÓN
========================= */
document.addEventListener("DOMContentLoaded", () => {

    function mostrarSeccion(id) {
        document.querySelectorAll("main section").forEach(s =>
            s.classList.remove("activa")
        );

        const seccion = document.getElementById(id);
        if (!seccion) return;

        seccion.classList.add("activa");

        if (id === "candidaturas" && typeof cargarCandidaturas === "function") cargarCandidaturas();
        if (id === "eventos" && typeof cargarEventos === "function") cargarEventos();
        if (id === "noticias" && typeof cargarNoticias === "function") cargarNoticias();
        if (id === "premios" && typeof cargarPremios === "function") cargarPremios();
        if (id === "patrocinadores" && typeof cargarPatrocinadores === "function") cargarPatrocinadores();
        if (id === "gala" && typeof cargarModo === "function") cargarModo();
    }

    window.mostrarSeccion = mostrarSeccion;

    const menuToggle = document.getElementById("menuToggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            document.getElementById("navLinks")?.classList.toggle("open");
        });
    }

    mostrarSeccion("candidaturas");
});

/* =========================
   MODAL CONFIRMACIÓN
========================= */
let _accionConfirmacion = null;

function abrirModalConfirmacion(mensaje, accion) {
    const modal = document.getElementById("modalConfirmacion");
    const msg = document.getElementById("modalConfirmacionMensaje");
    const btnOk = document.getElementById("btnConfirmacionAceptar");

    if (!modal || !msg || !btnOk) {
        if (confirm(mensaje)) accion();
        return;
    }

    msg.textContent = mensaje;
    _accionConfirmacion = accion;

    btnOk.onclick = () => {
        if (_accionConfirmacion) _accionConfirmacion();
        cerrarModalConfirmacion();
    };

    modal.classList.remove("hidden");
}

function cerrarModalConfirmacion() {
    const modal = document.getElementById("modalConfirmacion");
    const btnOk = document.getElementById("btnConfirmacionAceptar");

    modal.classList.add("hidden");
    _accionConfirmacion = null;
    btnOk.onclick = null;
}

window.addEventListener("keydown", e => {
    if (e.key === "Escape") cerrarModalConfirmacion();
});

/* =========================
   GALA – CONFIG
========================= */
const BASE_URL_GALA = "/ProyectoIntegrador2/app/controllers/GalaController.php";
const BASE_URL_EDICIONES = "/ProyectoIntegrador2/app/controllers/EdicionesController.php";

function mostrarModalError(mensaje) {
    showModal(mensaje || "Ha ocurrido un error");
}

/* =========================
   GALA – MODO PRE/POST
========================= */
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

                if (data.fecha) {
                    const inputFecha = document.getElementById("fechaGala");
                    if (inputFecha) inputFecha.value = data.fecha;
                }

                cargarSecciones();
            } else {
                galaPre.style.display = "none";
                galaPost.style.display = "block";
                cargarImagenesPost();
            }
        })
        .catch(() => mostrarModalError("Error al cargar modo de gala"));
}

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
                    <div class="seccion-item">
                        <b>${s.titulo}</b><br>
                        ${s.hora} – ${s.sala}<br>
                        -${s.descripcion}<br>

                        <button class="icon-btn edit"
                            onclick="editarSeccion(${s.id}, '${s.titulo}', '${s.hora}', '${s.sala}', '${s.descripcion}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button class="icon-btn delete"
                            onclick="abrirModalConfirmacion('¿Eliminar sección?', () => borrarSeccion(${s.id}))">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
            });
        });
}

let seccionEditando = null;

function mostrarFormSeccion() {
    const form = document.getElementById("formSeccion");
    seccionEditando = null;
    form.reset();
    form.style.display = "block";
}

function ocultarFormSeccion() {
    document.getElementById("formSeccion").style.display = "none";
}

function editarSeccion(id, titulo, hora, sala, descripcion) {
    seccionEditando = id;

    const form = document.getElementById("formSeccion");
    form.titulo.value = titulo;
    form.hora.value = hora;
    form.sala.value = sala;
    form.descripcion.value = descripcion;

    form.style.display = "block";
}

function borrarSeccion(id) {
    fetch(`${BASE_URL_GALA}?accion=borrarSeccion&id=${id}`)
        .then(() => cargarSecciones());
}

document.getElementById("formSeccion").addEventListener("submit", e => {
    e.preventDefault();

    const hora = e.target.hora.value;
    const [h] = hora.split(":");

    if (parseInt(h) < 12) {
        showModal("La hora debe ser a partir de las 12:00");
        return;
    }

    const formData = new FormData(e.target);
    let url = `${BASE_URL_GALA}?accion=crearSeccion`;

    if (seccionEditando) {
        formData.append("id", seccionEditando);
        url = `${BASE_URL_GALA}?accion=editarSeccion`;
    }

    fetch(url, { method: "POST", body: formData })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                ocultarFormSeccion();
                seccionEditando = null;
                cargarSecciones();
            } else {
                showModal(data.error || "Error al guardar sección");
            }
        });
});

/* =========================
   RESUMEN POST-GALA
========================= */
const formResumen = document.getElementById("formResumen");

if (formResumen) {
    formResumen.addEventListener("submit", e => {
        e.preventDefault();

        const formData = new FormData(formResumen);

        fetch(`${BASE_URL_GALA}?accion=guardarResumen`, {
            method: "POST",
            body: formData,
            credentials: "same-origin"
        })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                showModal("Resumen guardado correctamente");
                formResumen.reset();
            } else {
                showModal(data.error || "Error al guardar el resumen");
            }
        });
    });
}

/* =========================
   IMÁGENES POST-GALA
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
            } else {
                showModal(data.error);
            }
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

                        <button class="icon-btn delete"
                            onclick="abrirModalConfirmacion('¿Eliminar imagen?', () => borrarImagen(${img.id}))">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
            });
        });
}

function borrarImagen(id) {
    fetch(`${BASE_URL_GALA}?accion=borrarImagen&id=${id}`)
        .then(() => cargarImagenesPost());
}

/* =========================
   FECHA DE GALA
========================= */
function guardarFechaGala() {
    const fecha = document.getElementById("fechaGala").value;

    if (!fecha) {
        showModal("Selecciona una fecha");
        return;
    }

    fetch(`${BASE_URL_GALA}?accion=guardarFecha`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `fecha=${fecha}`,
        credentials: "same-origin"
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) showModal("Fecha guardada");
        else showModal(data.error);
    });
}

/* =========================
   GUARDAR EDICIÓN
========================= */
function guardarEdicion() {
    abrirModalConfirmacionEdicion();
}

function abrirModalConfirmacionEdicion() {
    document.getElementById("modalConfirmacionEdicion").classList.remove("hidden");
}

function cerrarModalConfirmacionEdicion() {
    document.getElementById("modalConfirmacionEdicion").classList.add("hidden");
}

function mostrarCampoAnio() {
    cerrarModalConfirmacionEdicion();
    document.getElementById("modalAnioEdicion").classList.remove("hidden");
}

function cerrarModalAnioEdicion() {
    document.getElementById("modalAnioEdicion").classList.add("hidden");
    document.getElementById("anioEdicion").value = "";
}

function guardarEdicionConAnio() {
    const input = document.getElementById("anioEdicion");
    const anio = (input ? input.value : "").trim();

    if (!anio) {
        showModal("Debe ingresar un año");
        return;
    }

    fetch(`${BASE_URL_EDICIONES}?accion=guardar`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `anio=${encodeURIComponent(anio)}`,
        credentials: "same-origin"
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) {
            showModal("Edición guardada correctamente");
            cerrarModalAnioEdicion();
            cargarModo();
        } else {
            showModal(data.error || "Error al guardar la edición");
        }
    })
    .catch(() => showModal("Ocurrió un error, por favor intente nuevamente."));
}
