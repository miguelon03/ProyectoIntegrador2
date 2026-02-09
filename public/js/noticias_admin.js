let noticiaEditandoId = null;
let noticiaAEliminar = null;

const BASE_URL = "/ProyectoIntegrador2/app/controllers/NoticiasController.php";

/* =========================
   VALIDACIÓN FRONT-END
========================= */
function mostrarError(campo, texto) {
    let error = campo.parentNode.querySelector(".error-msg");

    if (!error) {
        error = document.createElement("small");
        error.classList.add("error-msg");
        campo.parentNode.appendChild(error);
    }

    error.textContent = texto;

    campo.classList.add("input-error", "shake");

    setTimeout(() => campo.classList.remove("shake"), 300);
}

function limpiarErrores(form) {
    form.querySelectorAll(".error-msg").forEach(e => e.remove());
    form.querySelectorAll(".input-error").forEach(c => c.classList.remove("input-error"));
}


function validarFormularioNoticia(form) {
    let valido = true;

    const titulo = form.titulo;
    const descripcion = form.descripcion;

    limpiarErrores(form);

    // ============================
    // VALIDAR TÍTULO
    // ============================
    if (!titulo.value.trim()) {
        mostrarError(titulo, "Este campo es obligatorio");
        valido = false;
    } else if (titulo.value.trim().length < 3) {
        mostrarError(titulo, "El título debe tener al menos 3 caracteres");
        valido = false;
    }

    // ============================
    // VALIDAR DESCRIPCIÓN
    // ============================
    if (!descripcion.value.trim()) {
        mostrarError(descripcion, "Este campo es obligatorio");
        valido = false;
    } else if (descripcion.value.trim().length < 10) {
        mostrarError(descripcion, "La descripción debe tener al menos 10 caracteres");
        valido = false;
    }

    return valido;
}

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
    limpiarErrores(form);
    form.style.display = "block";
    noticiaEditandoId = null;
}

function ocultarFormulario() {
    const form = document.getElementById("formNoticia");
    form.reset();
    limpiarErrores(form);
    form.style.display = "none";
    noticiaEditandoId = null;
}

/* =========================
   EDITAR
========================= */
function editarNoticia(id, titulo, descripcion) {
    noticiaEditandoId = id;

    document.querySelector("#formNoticia [name='titulo']").value = titulo;
    document.querySelector("#formNoticia [name='descripcion']").value = descripcion;

    document.getElementById("formNoticia").style.display = "block";
}

/* =========================
   GUARDAR (CREAR / EDITAR)
========================= */
document.getElementById("formNoticia").addEventListener("submit", e => {
    e.preventDefault();

    const form = e.target;

    // VALIDACIÓN ANTES DE ENVIAR
    if (!validarFormularioNoticia(form)) {
        return;
    }

    const formData = new FormData(form);
    let url = `${BASE_URL}?accion=crear`;

    if (noticiaEditandoId) {
        formData.append("id", noticiaEditandoId);
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
