const URL_PREM = "/ProyectoIntegrador2/app/controllers/PremioController.php";

// Cache de categorías/ganadores (para UI)
let PREMIOS_CACHE = [];

/* =========================
   Modal de errores (panel organizador)
========================= */
function showErrorModal(msg) {
  // Usa el modal de premios (si existe)
  if (typeof abrirModalPremio === "function") {
    abrirModalPremio(msg);
    return;
  }
  alert(msg);
}

/* =========================
   DOM Ready
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formPremio");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      crearCategoria();
    });
  }

  const selCat = document.getElementById("categoriaSelect");
  if (selCat) {
    selCat.addEventListener("change", () => actualizarPuestoDisponibilidad());
  }

  const selPuesto = document.getElementById("puestoSelect");
  if (selPuesto) {
    selPuesto.addEventListener("change", () => actualizarPuestoDisponibilidad());
  }
});

/* =========================
   Cargar premios
========================= */
function cargarPremios() {
  fetch(`${URL_PREM}?accion=listar`, { credentials: "same-origin" })
    .then((r) => r.json())
    .then((data) => {
      if (!data.ok) throw new Error(data.error || "Error");

      PREMIOS_CACHE = data.premios || [];

      pintarCategorias(PREMIOS_CACHE);

      // Rellenar select categorías
      const selCat = document.getElementById("categoriaSelect");
      if (selCat) {
        selCat.innerHTML = "";
        PREMIOS_CACHE.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.id_premio;
          opt.textContent = p.nombre;
          selCat.appendChild(opt);
        });
      }

      // Cargar nominados (ya viene filtrado para no repetir ganadores)
      return cargarNominados();
    })
    .then(() => {
      actualizarPuestoDisponibilidad();
    })
    .catch((err) => {
      console.error(err);
      showErrorModal(err.message || "Error al cargar premios");
    });
}

/* =========================
   Pintar categorías + ganadores
========================= */
function pintarCategorias(premios) {
  const cont = document.getElementById("listaPremios");
  if (!cont) return;

  if (!premios.length) {
    cont.innerHTML = "<p>No hay categorías creadas.</p>";
    return;
  }

  cont.innerHTML = premios
    .map((p) => {
      const tienePuestos = ("ganador_primero" in p) || ("ganador_segundo" in p);

      let ganadoresHTML = "";
      if (tienePuestos) {
        ganadoresHTML = `
          <div class="premio-ganadores">
            <div><strong>1º premio:</strong> ${p.ganador_primero ?? "-"}</div>
            <div><strong>2º premio:</strong> ${p.ganador_segundo ?? "-"}</div>
          </div>
        `;
      } else {
        ganadoresHTML = `
          <div class="premio-ganadores">
            <div><strong>Ganadores:</strong> ${p.ganadores ? p.ganadores : "-"}</div>
          </div>
        `;
      }

      return `
        <div class="premio-card">
          <h4>${escapeHtml(p.nombre)}</h4>
          ${p.descripcion ? `<p class="premio-desc">${escapeHtml(p.descripcion)}</p>` : ""}
          ${ganadoresHTML}
        </div>
      `;
    })
    .join("");
}

/* =========================
   Cargar nominados
========================= */
function cargarNominados() {
  return fetch(`${URL_PREM}?accion=nominados`, { credentials: "same-origin" })
    .then((r) => r.json())
    .then((data) => {
      if (!data.ok) throw new Error(data.error || "Error");

      const selNom = document.getElementById("nominadoSelect");
      if (!selNom) return;

      selNom.innerHTML = "";
      const nominados = data.nominados || [];

      if (!nominados.length) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No hay nominados disponibles";
        selNom.appendChild(opt);
        return;
      }

      nominados.forEach((n) => {
        const opt = document.createElement("option");
        opt.value = n.id_inscripcion;
        opt.textContent = n.usuario;
        selNom.appendChild(opt);
      });
    })
    .catch((err) => {
      console.error(err);
      showErrorModal(err.message || "Error al cargar nominados");
    });
}

/* =========================
   Crear categoría
========================= */
function crearCategoria() {
  const form = document.getElementById("formPremio");
  if (!form) return;

  const nombre = (form.querySelector('input[name="nombre"]')?.value || "").trim();
  const descripcion = (form.querySelector('textarea[name="descripcion"]')?.value || "").trim();

  if (!nombre) {
    showErrorModal("Pon un nombre de categoría");
    return;
  }

  const fd = new FormData();
  fd.append("accion", "crear");
  fd.append("nombre", nombre);
  fd.append("descripcion", descripcion);

  fetch(URL_PREM, {
    method: "POST",
    credentials: "same-origin",
    body: fd,
  })
    .then((r) => r.json())
    .then((data) => {
      if (!data.ok) {
        showErrorModal(data.error || "Error al crear categoría");
        return;
      }
      form.reset();
      cargarPremios();
    })
    .catch((err) => {
      console.error(err);
      showErrorModal("Error al crear categoría");
    });
}

/* =========================
   Asignar premio
========================= */
function asignarPremio() {
  const selCat = document.getElementById("categoriaSelect");
  const selNom = document.getElementById("nominadoSelect");
  const selPuesto = document.getElementById("puestoSelect");

  const id_premio = selCat?.value || "";
  const id_inscripcion = selNom?.value || "";
  const puesto = selPuesto?.value || "PRIMERO";

  if (!id_premio) return showErrorModal("Selecciona una categoría");
  if (!id_inscripcion) return showErrorModal("Selecciona un nominado");

  const fd = new FormData();
  fd.append("accion", "asignar");
  fd.append("id_premio", id_premio);
  fd.append("id_inscripcion", id_inscripcion);
  fd.append("puesto", puesto);

  fetch(URL_PREM, {
    method: "POST",
    credentials: "same-origin",
    body: fd,
  })
    .then((r) => r.json())
    .then((data) => {
      if (!data.ok) {
        // Modal requerido por ti
        showErrorModal(data.error || "Error al asignar premio");
        return;
      }

      // Quita el ganador del select para que no se pueda volver a asignar
      const opt = selNom?.querySelector(`option[value="${id_inscripcion}"]`);
      if (opt) opt.remove();

      // Refresca categorías y deshabilita puesto si ya ocupado
      cargarPremios();
    })
    .catch((err) => {
      console.error(err);
      showErrorModal("Error al asignar premio");
    });
}

/* =========================
   Deshabilitar PRIMERO/SEGUNDO si ya están ocupados
========================= */
function actualizarPuestoDisponibilidad() {
  const selCat = document.getElementById("categoriaSelect");
  const selPuesto = document.getElementById("puestoSelect");
  if (!selCat || !selPuesto) return;

  const id = String(selCat.value || "");
  const premio = PREMIOS_CACHE.find((p) => String(p.id_premio) === id);

  const optPrim = selPuesto.querySelector('option[value="PRIMERO"]');
  const optSeg = selPuesto.querySelector('option[value="SEGUNDO"]');

  if (!premio || !optPrim || !optSeg) return;

  // Si el controller devuelve ganador_primero_id / ganador_segundo_id
  optPrim.disabled = !!premio.ganador_primero_id;
  optSeg.disabled = !!premio.ganador_segundo_id;

  // Si el seleccionado quedó deshabilitado, cambia automáticamente
  if (selPuesto.value === "PRIMERO" && optPrim.disabled && !optSeg.disabled) selPuesto.value = "SEGUNDO";
  if (selPuesto.value === "SEGUNDO" && optSeg.disabled && !optPrim.disabled) selPuesto.value = "PRIMERO";
}

/* =========================
   Utils
========================= */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
