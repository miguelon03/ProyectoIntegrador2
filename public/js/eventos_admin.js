let eventoEditando = null;
let eventoAEliminar = null;

const BASE_URL_EVENTOS = "/ProyectoIntegrador2/app/controllers/EventoController.php";

/* =========================
   VALIDACIÓN FRONT-END
========================= */
function mostrarError(campo, mensaje) {
    const error = campo.parentNode.querySelector(".error");
    if (error) error.textContent = mensaje;
}

function limpiarErrores(form) {
    form.querySelectorAll(".error").forEach(e => e.textContent = "");
}

function validarFormularioEvento(form) {
    let valido = true;

    const titulo = form.titulo;
    const descripcion = form.descripcion;
    const fecha = form.fecha;
    const hora = form.hora;

    limpiarErrores(form);

    /* ============================
       VALIDAR TÍTULO
    ============================ */
    if (!titulo.value.trim()) {
        mostrarError(titulo, "Este campo es obligatorio");
        valido = false;
    } else if (titulo.value.trim().length < 3) {
        mostrarError(titulo, "El título debe tener al menos 3 caracteres");
        valido = false;
    }

    /* ============================
       VALIDAR DESCRIPCIÓN
    ============================ */
    if (!descripcion.value.trim()) {
        mostrarError(descripcion, "Este campo es obligatorio");
        valido = false;
    } else if (descripcion.value.trim().length < 5) {
        mostrarError(descripcion, "La descripción debe tener al menos 5 caracteres");
        valido = false;
    }

    /* ============================
       VALIDAR FECHA
    ============================ */
    if (!fecha.value) {
        mostrarError(fecha, "Este campo es obligatorio");
        valido = false;
    } else {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaEvento = new Date(fecha.value + "T00:00:00");

        if (fechaEvento < hoy) {
            mostrarError(fecha, "La fecha no puede ser anterior a hoy");
            valido = false;
        }
    }

    /* ============================
       VALIDAR HORA (08:30 - 23:00)
    ============================ */
    if (!hora.value) {
        mostrarError(hora, "Este campo es obligatorio");
        valido = false;
    } else {
        const [h, m] = hora.value.split(":").map(Number);
        const minutos = h * 60 + m;

        const minPermitido = 8 * 60 + 30;   // 08:30
        const maxPermitido = 23 * 60;       // 23:00

        if (minutos < minPermitido || minutos > maxPermitido) {
            mostrarError(hora, "La hora debe estar entre 08:30 y 23:00");
            valido = false;
        }
    }

    /* ============================
       VALIDAR HORA SI LA FECHA ES HOY
    ============================ */
    if (fecha.value && hora.value) {
        const hoy = new Date();
        const fechaEvento = new Date(fecha.value + "T00:00:00");

        if (fechaEvento.toDateString() === hoy.toDateString()) {
            const [h, m] = hora.value.split(":").map(Number);
            const minutosEvento = h * 60 + m;

            const minutosAhora = hoy.getHours() * 60 + hoy.getMinutes();

            if (minutosEvento < minutosAhora) {
                mostrarError(hora, "La hora no puede ser anterior a la hora actual");
                valido = false;
            }
        }
    }

    return valido;
}

/* =========================
   CARGAR EVENTOS
========================= */
function cargarEventos() {
    fetch(`${BASE_URL_EVENTOS}?accion=listar`, {
        credentials: "same-origin"
    })
        .then(r => r.json())
        .then(data => {
            const cont = document.getElementById("listaEventos");
            cont.innerHTML = "";

            if (!data.ok || data.eventos.length === 0) {
                cont.innerHTML = "<p>No hay eventos</p>";
                return;
            }

            data.eventos.forEach(e => {
                cont.innerHTML += `
                    <div class="news-card">
                        <div>
                            <h3>${escapeHtml(e.titulo)}</h3>
                            <p>${escapeHtml(e.descripcion)}</p>
                            <small>${e.fecha} · ${e.hora}</small>
                        </div>

                        <div class="news-actions">
                            <button type="button" class="icon-btn edit"
                                onclick="editarEvento(
                                    ${e.id_evento},
                                    '${escapeHtml(e.titulo)}',
                                    '${escapeHtml(e.descripcion)}',
                                    '${e.fecha}',
                                    '${e.hora}'
                                )">
                                ✏️
                            </button>

                            <button type="button" class="icon-btn delete"
                                onclick="confirmarEliminarEvento(${e.id_evento})">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            });
        });
}

/* =========================
   FORMULARIO
========================= */
function mostrarFormularioEvento() {
    const form = document.getElementById("formEvento");
    form.reset();
    limpiarErrores(form);
    form.style.display = "block";
    eventoEditando = null;
}

function ocultarFormularioEvento() {
    const form = document.getElementById("formEvento");
    form.reset();
    limpiarErrores(form);
    form.style.display = "none";
    eventoEditando = null;
}

/* =========================
   EDITAR EVENTO
========================= */
function editarEvento(id, titulo, descripcion, fecha, hora) {
    eventoEditando = id;

    document.querySelector("#formEvento [name='titulo']").value = titulo;
    document.querySelector("#formEvento [name='descripcion']").value = descripcion;
    document.querySelector("#formEvento [name='fecha']").value = fecha;
    document.querySelector("#formEvento [name='hora']").value = hora;

    document.getElementById("formEvento").style.display = "block";
}

/* =========================
   GUARDAR EVENTO (con validación)
========================= */
document.getElementById("formEvento").addEventListener("submit", e => {
    e.preventDefault();

    const form = e.target;

    // VALIDACIÓN ANTES DE ENVIAR
    if (!validarFormularioEvento(form)) {
        return; // No enviar si hay errores
    }

    const formData = new FormData(form);
    let url = `${BASE_URL_EVENTOS}?accion=crear`;

    if (eventoEditando) {
        formData.append("id", eventoEditando);
        url = `${BASE_URL_EVENTOS}?accion=editar`;
    }

    fetch(url, {
        method: "POST",
        body: formData,
        credentials: "same-origin"
    })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                ocultarFormularioEvento();
                cargarEventos();
            } else {
                alert(res.error || "Error al guardar el evento");
            }
        });
});

/* =========================
   MODAL BORRAR EVENTO
========================= */
function confirmarEliminarEvento(id) {
    eventoAEliminar = id;
    document.getElementById("modalBorrarEvento").classList.remove("hidden");
}

function cerrarModalEliminarEvento() {
    eventoAEliminar = null;
    document.getElementById("modalBorrarEvento").classList.add("hidden");
}

function eliminarEventoConfirmado() {
    if (!eventoAEliminar) return;

    fetch(`${BASE_URL_EVENTOS}?accion=borrar&id=${eventoAEliminar}`, {
        credentials: "same-origin"
    })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                cerrarModalEliminarEvento();
                cargarEventos();
            } else {
                alert(res.error || "Error al eliminar el evento");
            }
        });
}

/* =========================
   UTIL
========================= */
function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("'", "&#039;")
        .replaceAll('"', "&quot;");
}
