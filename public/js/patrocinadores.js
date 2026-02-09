const URL_PAT = "/ProyectoIntegrador2/app/controllers/PatrocinadoresController.php";

document.addEventListener("DOMContentLoaded", () => {
  cargarPatrocinadores();

  const form = document.getElementById("formPatrocinador");
  if (form) {
    form.addEventListener("submit", crearPatrocinador);
  }
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
