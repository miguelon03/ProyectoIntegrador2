let noticiaEditandoId = null;

let noticiaAEliminar = null;

const BASE_URL = "/ProyectoIntegrador2/app/controllers/NoticiasController.php";

/* =========================
   CARGAR NOTICIAS
========================= */
function cargarNoticias() {
    fetch(`${BASE_URL}?accion=listar`, {
        credentials: "same-origin"
    })
        .then(r => r.json())
        .then(data => {
            const cont = document.getElementById("listaNoticias");
            cont.innerHTML = "";

            if (!data.ok || data.noticias.length === 0) {
                cont.innerHTML = "<p>No hay noticias</p>";
                return;
            }

            data.noticias.forEach(n => {
                cont.innerHTML += `
                    <div class="news-card">
                        <div>
                            <h3>${escapeHtml(n.titulo)}</h3>
                            <p>${escapeHtml(n.descripcion)}</p>
                            <small>${n.fecha}</small>
                        </div>

                        <div class="news-actions">
                            <button type="button" class="icon-btn edit"
                                onclick="editarNoticia(${n.id_noticia}, '${escapeHtml(n.titulo)}', '${escapeHtml(n.descripcion)}')">
                                ✏️
                            </button>

                            <button type="button" class="icon-btn delete"
                                onclick="confirmarEliminarNoticia(${n.id_noticia})">
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
function mostrarFormularioNoticia() {
    const form = document.getElementById("formNoticia");
    form.reset();
    form.style.display = "block";
    noticiaEditandoId = null;
}

function ocultarFormulario() {
    const form = document.getElementById("formNoticia");
    form.reset();
    form.style.display = "none";
    noticiaEditandoId = null;
}

/* =========================
   EDITAR
========================= */
function editarNoticia(id, titulo, descripcion) {
    noticiaEditando = id;

    document.querySelector("#formNoticia [name='titulo']").value = titulo;
    document.querySelector("#formNoticia [name='descripcion']").value = descripcion;

    document.getElementById("formNoticia").style.display = "block";
}

/* =========================
   GUARDAR (CREAR / EDITAR)
========================= */
document.getElementById("formNoticia").addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(e.target);
    let url = `${BASE_URL}?accion=crear`;

    if (noticiaEditandoId) {
        formData.append("id", noticiaEditando);
        url = `${BASE_URL}?accion=editar`;
    }

    fetch(url, {
        method: "POST",
        body: formData,
        credentials: "same-origin"
    })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                ocultarFormulario();
                cargarNoticias();
            } else {
                alert(res.error || "Error al guardar la noticia");
            }
        });
});

/* =========================
   MODAL BORRAR
========================= */
function confirmarEliminarNoticia(id) {
    noticiaAEliminar = id;
    document.getElementById("modalBorrarNoticia").classList.remove("hidden");
}

function cerrarModalEliminar() {
    noticiaAEliminar = null;
    document.getElementById("modalBorrarNoticia").classList.add("hidden");
}

function eliminarNoticiaConfirmada() {
    if (!noticiaAEliminar) return;

    fetch(`${BASE_URL}?accion=borrar&id=${noticiaAEliminar}`, {
        credentials: "same-origin"
    })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                cerrarModalEliminar();
                cargarNoticias();
            } else {
                alert(res.error || "Error al eliminar la noticia");
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
