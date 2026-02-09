const URL_PAT = "/ProyectoIntegrador2/app/controllers/PatrocinadoresController.php";

let patrocinadorAEliminar = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarPatrocinadores();

    const form = document.getElementById("formPatrocinador");
    if (form) {
        form.addEventListener("submit", crearPatrocinador);
    }
});

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
    const err = document.getElementById("errorPatrocinador");
    if (err) err.innerText = "";
}

function validarFormularioPatrocinador(form) {
    let valido = true;

    const nombre = form.nombre;
    const logoFile = form.logo?.files?.[0];

    limpiarErrores(form);

    if (!nombre.value.trim()) {
        mostrarError(nombre, "Este campo es obligatorio");
        valido = false;
    } else if (nombre.value.trim().length < 2) {
        mostrarError(nombre, "El nombre debe tener al menos 2 caracteres");
        valido = false;
    }

    if (!logoFile) {
        mostrarError(form.logo, "Debes seleccionar una imagen");
        valido = false;
    } else {
        const tiposPermitidos = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!tiposPermitidos.includes(logoFile.type)) {
            mostrarError(form.logo, "El archivo debe ser PNG, JPG o WEBP");
            valido = false;
        }
    }

    return valido;
}

/* =========================
   LISTAR
========================= */
function cargarPatrocinadores() {
    fetch(`${URL_PAT}?accion=listar`, { credentials: "same-origin" })
        .then(r => r.json())
        .then(data => {
            const cont = document.getElementById("listaPatrocinadores");
            if (!cont) return;

            cont.innerHTML = "";

            if (!data.ok || !data.patrocinadores || data.patrocinadores.length === 0) {
                cont.innerHTML = "<p>No hay patrocinadores</p>";
                return;
            }

            data.patrocinadores.forEach(p => {
                const div = document.createElement("div");
                div.className = "patro-card";

                div.innerHTML = `
                    <img src="${p.logo}" alt="${escapeHtml(p.nombre)}">
                    <strong>${escapeHtml(p.nombre)}</strong>
                    <button class="icon-btn delete" onclick="confirmarEliminarPatrocinador(${p.id_patrocinador})">🗑️</button>
                `;

                cont.appendChild(div);
            });
        })
        .catch(() => {
            const err = document.getElementById("errorPatrocinador");
            if (err) err.innerText = "Error al cargar patrocinadores";
        });
}

/* =========================
   CREAR
========================= */
function crearPatrocinador(e) {
    e.preventDefault();
    const form = e.target;

    if (!validarFormularioPatrocinador(form)) return;

    const fd = new FormData(form);
    fd.append("accion", "crear"); // ✅ IMPORTANTE: el controller espera "crear"

    fetch(URL_PAT, {
        method: "POST",
        credentials: "same-origin",
        body: fd
    })
        .then(r => r.json())
        .then(data => {
            if (!data.ok) {
                const err = document.getElementById("errorPatrocinador");
                if (err) err.innerText = data.error || "Error al crear patrocinador";
                return;
            }

            form.reset();
            limpiarErrores(form);
            cargarPatrocinadores();
        })
        .catch(() => {
            const err = document.getElementById("errorPatrocinador");
            if (err) err.innerText = "Error de red al crear patrocinador";
        });
}

/* =========================
   ELIMINAR (con modal genérico)
========================= */
function confirmarEliminarPatrocinador(id) {
    patrocinadorAEliminar = id;

    if (typeof abrirModalConfirmacion === "function") {
        abrirModalConfirmacion(
            "¿Eliminar patrocinador?",
            eliminarPatrocinadorConfirmado
        );
        return;
    }

    if (confirm("¿Eliminar patrocinador?")) {
        eliminarPatrocinadorConfirmado();
    }
}

function eliminarPatrocinadorConfirmado() {
    if (!patrocinadorAEliminar) return;

    fetch(`${URL_PAT}?accion=borrar&id=${patrocinadorAEliminar}`, {
        credentials: "same-origin"
    })
        .then(r => r.json())
        .then(() => {
            patrocinadorAEliminar = null;
            cargarPatrocinadores();
        });
}

/* =========================
   UTIL
========================= */
function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("'", "&#039;")
        .replaceAll('"', "&quot;");
}
