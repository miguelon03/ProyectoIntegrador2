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
const BASE_URL_EDICIONES = "/ProyectoIntegrador2/app/controllers/EdicionesController.php";

// Fallback sencillo (en algunas ramas del proyecto se llamaba pero no existía)
function mostrarModalError(mensaje) {
    alert(mensaje || "Ha ocurrido un error");
}

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
            showModal(data.error || "Error al guardar sección");
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
        showModal("Resumen guardado correctamente");

        // 🔑 LIMPIAR EL TEXTAREA DESPUÉS DE GUARDAR
        formResumen.reset();
    } else {
        showModal(data.error || "Error al guardar el resumen");
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
        if (data.ok) {
            showModal("Fecha guardada");
        } else {
            showModal(data.error);
        }
    });
}

// El botón del HTML llama a guardarEdicion()
function guardarEdicion() {
    abrirModalConfirmacionEdicion();
}
// Función para abrir el modal de confirmación de guardar edición
function abrirModalConfirmacionEdicion() {
    document.getElementById("modalConfirmacionEdicion").classList.remove("hidden");
}

// Función para cerrar el modal de confirmación de guardar edición
function cerrarModalConfirmacionEdicion() {
    document.getElementById("modalConfirmacionEdicion").classList.add("hidden");
}

// Función para mostrar el campo de año y cerrar el modal de confirmación
function mostrarCampoAnio() {
    cerrarModalConfirmacionEdicion(); // Cierra el modal de confirmación
    // Muestra el modal para ingresar el año
    document.getElementById("modalAnioEdicion").classList.remove("hidden");
}

function cerrarModalAnioEdicion() {
    const modal = document.getElementById("modalAnioEdicion");
    if (modal) modal.classList.add("hidden");
    const input = document.getElementById("anioEdicion");
    if (input) input.value = "";
}

// Guardar edición:
// - No pedimos texto/imágenes al front: ya están guardados en la BD (gala.texto_resumen y gala_imagenes)
// - El backend copia esos datos a "ediciones" + "ediciones_imagenes" y resetea la gala.
function guardarEdicionConAnio() {
    const input = document.getElementById("anioEdicion");
    const anio = (input ? input.value : "").trim();

    if (!anio) {
        alert("Debe ingresar un año");
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
                alert("Edición guardada correctamente");
                cerrarModalAnioEdicion();
                // Refrescar UI: vuelve a PRE y limpia la parte de post-gala
                cargarModo();
            } else {
                alert(data.error || "Error al guardar la edición");
            }
        })
        .catch(error => {
            console.error("Error al guardar edición:", error);
            alert("Ocurrió un error, por favor intente nuevamente.");
        });
}
