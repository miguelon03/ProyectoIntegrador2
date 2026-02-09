const URL_PAT = "/ProyectoIntegrador2/app/controllers/PatrocinadoresController.php";

document.addEventListener("DOMContentLoaded", () => {
  cargarPatrocinadores();

<<<<<<< HEAD
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


function validarFormularioPatrocinador(form) {
    let valido = true;

    const nombre = form.nombre;
    const logo = form.logo.files[0];

    limpiarErrores(form);

    // ============================
    // VALIDAR NOMBRE
    // ============================
    if (!nombre.value.trim()) {
        mostrarError(nombre, "Este campo es obligatorio");
        valido = false;
    } else if (nombre.value.trim().length < 2) {
        mostrarError(nombre, "El nombre debe tener al menos 2 caracteres");
        valido = false;
    }

    // ============================
    // VALIDAR LOGO
    // ============================
    if (!logo) {
        mostrarError(form.logo, "Debes seleccionar una imagen");
        valido = false;
    } else {
        const tiposPermitidos = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!tiposPermitidos.includes(logo.type)) {
            mostrarError(form.logo, "El archivo debe ser PNG, JPG o WEBP");
            valido = false;
        }
    }

    return valido;
}

/* =========================
   CARGAR PATROCINADORES
========================= */
function cargarPatrocinadores() {
    fetch(`${BASE_URL_PATROCINADORES}?accion=listar`, {
        credentials: "same-origin"
    })
        .then(r => r.json())
        .then(data => {
            const cont = document.getElementById("listaPatrocinadores");
            cont.innerHTML = "";

            if (!data.ok || data.patrocinadores.length === 0) {
                cont.innerHTML = "<p>No hay patrocinadores</p>";
                return;
            }

            data.patrocinadores.forEach(p => {
                cont.innerHTML += `
                    <div class="news-card">
                        <div>
                            <h3>${escapeHtml(p.nombre)}</h3>
                            <img src="../img/patrocinadores/${p.imagen}" style="width:120px;object-fit:contain;">
                        </div>

                        <div class="news-actions">
                            <button type="button" class="icon-btn delete"
                                onclick="confirmarEliminarPatrocinador(${p.id_patrocinador})">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            });
        });
}

/* =========================
   GUARDAR PATROCINADOR
========================= */
document.getElementById("formPatrocinador").addEventListener("submit", e => {
    e.preventDefault();

    const form = e.target;

    // VALIDACIÓN ANTES DE ENVIAR
    if (!validarFormularioPatrocinador(form)) {
        return;
    }

    const formData = new FormData(form);

    fetch(`${BASE_URL_PATROCINADORES}?accion=guardar`, {
        method: "POST",
        body: formData,
        credentials: "same-origin"
    })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                form.reset();
                limpiarErrores(form);
                cargarPatrocinadores();
            } else {
                alert(res.error || "Error al guardar el patrocinador");
            }
        });
=======
  const form = document.getElementById("formPatrocinador");
  if (form) {
    form.addEventListener("submit", crearPatrocinador);
  }
>>>>>>> 519d238549630f9cc45ddda54dd90f4a76f6657d
});

/* =========================
   CARGAR
========================= */
function cargarPatrocinadores() {
  fetch(`${URL_PAT}?accion=listar`, { credentials: "same-origin" })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) return;

      const cont = document.getElementById("listaPatrocinadores");
      cont.innerHTML = "";

      if (!data.patrocinadores.length) {
        cont.innerHTML = "<p>No hay patrocinadores.</p>";
        return;
      }

      data.patrocinadores.forEach(p => {
        const div = document.createElement("div");
        div.className = "patro-card";

        div.innerHTML = `
          <img src="${p.logo}" alt="${p.nombre}">
          <strong>${p.nombre}</strong>
          <button class="icon-btn delete" onclick="eliminarPatrocinador(${p.id_patrocinador})">
            🗑️
          </button>
        `;

        cont.appendChild(div);
      });
    });
}

/* =========================
   CREAR
========================= */
function crearPatrocinador(e) {
  e.preventDefault();

  const form = e.target;
  const fd = new FormData(form);

  if (!fd.get("nombre") || !fd.get("logo").name) {
    document.getElementById("errorPatrocinador").innerText = "Nombre e imagen obligatorios";
    return;
  }

  fd.append("accion", "crear");

  fetch(URL_PAT, {
    method: "POST",
    credentials: "same-origin",
    body: fd
  })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        document.getElementById("errorPatrocinador").innerText = data.error;
        return;
      }

      form.reset();
      cargarPatrocinadores();
    });
}

/* =========================
   ELIMINAR
========================= */
function eliminarPatrocinador(id) {
  if (!confirm("¿Eliminar patrocinador?")) return;

  fetch(`${URL_PAT}?accion=borrar&id=${id}`, {
    credentials: "same-origin"
  })
    .then(r => r.json())
    .then(() => cargarPatrocinadores());
}
