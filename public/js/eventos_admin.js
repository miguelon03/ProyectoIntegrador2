let eventoEditando = null;
let eventoAEliminar = null;

const BASE_URL_EVENTOS = "/ProyectoIntegrador2/app/controllers/EventoController.php";

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
    form.style.display = "block";
    eventoEditando = null;
}

function ocultarFormularioEvento() {
    const form = document.getElementById("formEvento");
    form.reset();
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
   GUARDAR EVENTO
========================= */
document.getElementById("formEvento").addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(e.target);
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
