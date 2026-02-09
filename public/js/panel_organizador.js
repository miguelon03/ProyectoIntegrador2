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

    // ✅ Cargar por defecto candidaturas
    mostrarSeccion("candidaturas");
});

/* =========================
   MODAL CONFIRMACIÓN (GENÉRICO)
   - Reutilizable para Noticias y Eventos
========================= */
let _accionConfirmacion = null;

function abrirModalConfirmacion(mensaje, accion) {
    const modal = document.getElementById("modalConfirmacion");
    const msg = document.getElementById("modalConfirmacionMensaje");
    const btnOk = document.getElementById("btnConfirmacionAceptar");

    // Fallback mínimo (por si alguien borra el HTML)
    if (!modal || !msg || !btnOk) {
        if (confirm(mensaje)) accion();
        return;
    }

    msg.textContent = mensaje;
    _accionConfirmacion = typeof accion === "function" ? accion : null;

    // Limpieza de handler anterior y set del actual
    btnOk.onclick = () => {
        try {
            if (_accionConfirmacion) _accionConfirmacion();
        } finally {
            cerrarModalConfirmacion();
        }
    };

    modal.classList.remove("hidden");
}

function cerrarModalConfirmacion() {
    const modal = document.getElementById("modalConfirmacion");
    const btnOk = document.getElementById("btnConfirmacionAceptar");

    if (modal) modal.classList.add("hidden");
    _accionConfirmacion = null;
    if (btnOk) btnOk.onclick = null;
}

/* Cerrar con ESC */
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        cerrarModalConfirmacion();
    }
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

                // 🔑 FECHA DE LA GALA (FUERA DE LAS SECCIONES)
                if (data.fecha) {
                    const inputFecha = document.getElementById("fechaGala");
                    if (inputFecha) {
                        inputFecha.value = data.fecha;
                    }
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
                        <b>${s.titulo}</b> <br>
                         ${s.hora} – ${s.sala} <br>
                         -${s.descripcion} <br>
                        <button onclick="editarSeccion(${s.id}, '${s.titulo}', '${s.hora}', '${s.sala}', '${s.descripcion}')">✏️</button>
                        <button onclick="borrarSeccion(${s.id})">🗑️</button>
                    </div>
                `;
            });
        });
}
function mostrarFormSeccion() {
    const form = document.getElementById("formSeccion");
    if (!form) return;

    // 🔑 MODO CREAR → no estamos editando
    seccionEditando = null;

    // 🔑 LIMPIAR CAMPOS
    form.reset();

    form.style.display = "block";
}

function ocultarFormSeccion() {
    const form = document.getElementById("formSeccion");
    if (!form) return;
    form.style.display = "none";
}

let seccionEditando = null;

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
    if (!confirm("¿Eliminar sección?")) return;
    fetch(`${BASE_URL_GALA}?accion=borrarSeccion&id=${id}`)
        .then(() => cargarSecciones());
}


document.getElementById("formSeccion").addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(e.target);

    let url = `${BASE_URL_GALA}?accion=crearSeccion`;

    if (seccionEditando) {
        formData.append("id", seccionEditando);
        url = `${BASE_URL_GALA}?accion=editarSeccion`;
    }

    fetch(url, {
        method: "POST",
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) {
            ocultarFormSeccion();
            seccionEditando = null;
            cargarSecciones();
        } else {
            alert(data.error || "Error al guardar sección");
        }
    });
});


/* =========================
   GUARDAR TEXTO RESUMEN (POST-GALA)
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
        alert("Resumen guardado correctamente");

        // 🔑 LIMPIAR EL TEXTAREA DESPUÉS DE GUARDAR
        formResumen.reset();
    } else {
        alert(data.error || "Error al guardar el resumen");
    }
});

    });
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

let imagenAEliminar = null;

function borrarImagen(id) {
    imagenAEliminar = id;
    document.getElementById("modalEliminarImagen").classList.remove("hidden");
}
/* =========================
  MODAL
========================= */
function cerrarModalImagen() {
    imagenAEliminar = null;
    document.getElementById("modalEliminarImagen").classList.add("hidden");
}

function confirmarEliminarImagen() {
    if (!imagenAEliminar) return;

    fetch(`${BASE_URL_GALA}?accion=borrarImagen&id=${imagenAEliminar}`)
        .then(() => {
            cerrarModalImagen();
            cargarImagenesPost();
        });
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

function guardarFechaGala() {
    const fecha = document.getElementById("fechaGala").value;
    if (!fecha) {
        alert("Selecciona una fecha");
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
        if (data.ok) {
            alert("Fecha guardada");
        } else {
            alert(data.error);
        }
    });
}
