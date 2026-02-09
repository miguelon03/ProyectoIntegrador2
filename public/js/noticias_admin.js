const URL_NOT = "/ProyectoIntegrador2/app/controllers/NoticiasController.php";

let noticiaEditandoId = null;

document.addEventListener("DOMContentLoaded", () => {
  cargarNoticias();

  const form = document.getElementById("formNoticia");
  if (form) {
    form.addEventListener("submit", guardarNoticia);
  }
});

/* =========================
   MOSTRAR / OCULTAR FORM
========================= */
function mostrarFormularioNoticia() {
  document.getElementById("formNoticia").style.display = "block";
}

function ocultarFormularioNoticia() {
  document.getElementById("formNoticia").style.display = "none";
  document.getElementById("formNoticia").reset();
  noticiaEditandoId = null;
}

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
  fetch(`${URL_NOT}?accion=listar`, { credentials: "same-origin" })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) return;

      const cont = document.getElementById("listaNoticias");
      cont.innerHTML = "";

      data.noticias.forEach(n => {
        const div = document.createElement("div");
        div.className = "news-card";

        div.innerHTML = `
          <div>
            <strong>${n.titulo}</strong>
            <p>${n.descripcion}</p>
          </div>
          <div class="news-actions">
            <button class="icon-btn edit" onclick="editarNoticia(${n.id_noticia}, '${escapeJS(n.titulo)}', '${escapeJS(n.descripcion)}')">
              ✏️
            </button>
            <button class="icon-btn delete" onclick="eliminarNoticia(${n.id_noticia})">
              🗑️
            </button>
          </div>
        `;

        cont.appendChild(div);
      });
    });
}

/* =========================
   GUARDAR / ACTUALIZAR
========================= */
function guardarNoticia(e) {
  e.preventDefault();

  const form = e.target;
  const titulo = form.titulo.value.trim();
  const descripcion = form.descripcion.value.trim();

  if (!titulo || !descripcion) {
    document.getElementById("errorNoticia").innerText = "Rellena todos los campos";
    return;
  }

  const fd = new FormData();
  fd.append("titulo", titulo);
  fd.append("descripcion", descripcion);

  if (noticiaEditandoId) {
    fd.append("accion", "editar");
    fd.append("id", noticiaEditandoId);
  } else {
    fd.append("accion", "crear");
  }

  fetch(URL_NOT, {
    method: "POST",
    credentials: "same-origin",
    body: fd
  })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        document.getElementById("errorNoticia").innerText = data.error;
        return;
      }

      ocultarFormularioNoticia();
      cargarNoticias();
    });
}

/* =========================
   EDITAR
========================= */
function editarNoticia(id, titulo, descripcion) {
  mostrarFormularioNoticia();

  const form = document.getElementById("formNoticia");
  form.titulo.value = titulo;
  form.descripcion.value = descripcion;

  noticiaEditandoId = id;
}

/* =========================
   ELIMINAR
========================= */
function eliminarNoticia(id) {
  if (!confirm("¿Seguro que quieres eliminar esta noticia?")) return;

  fetch(`${URL_NOT}?accion=borrar&id=${id}`, {
    credentials: "same-origin"
  })
    .then(r => r.json())
    .then(() => cargarNoticias());
}


/* =========================
   UTILS
========================= */
function escapeJS(str) {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}
