const URL_PREMIOS = "/ProyectoIntegrador2/app/controllers/PremioController.php";

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("ueNominado")) return;

  cargarPanelPremios();
});

/* =========================
   CARGA TOTAL PANEL PREMIOS
========================= */
function cargarPanelPremios() {
  // 1) cargar asignados
  fetch(`${URL_PREMIOS}?accion=asignados`, { credentials: "same-origin" })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) return alert(data.error || "Error al cargar premios asignados");

      pintarAsignados(data.asignados || []);
      pintarHonorificoAsignado(data.honorifico || null);

      // 2) con los asignados calculamos qué puestos quedan libres
      const libres = calcularPuestosLibres(data.asignados || []);
      configurarSelectPuestos(libres);

      // 3) cargar nominados disponibles para los premios que aún tengan puestos libres
      if (libres.UE.length > 0) cargarNominados("UE");
      if (libres.ALUMNI.length > 0) cargarNominados("ALUMNI");

      // 4) ocultar bloques de asignación si ya están completos
      toggleBloqueAsignacion("UE", libres.UE.length > 0);
      toggleBloqueAsignacion("ALUMNI", libres.ALUMNI.length > 0);
    });
}

/* =========================
   CALCULAR PUESTOS LIBRES
========================= */
function calcularPuestosLibres(asignados) {
  const todos = {
    UE: ["PRIMERO", "SEGUNDO", "TERCERO"],
    ALUMNI: ["PRIMERO", "SEGUNDO"]
  };

  const ocupados = { UE: new Set(), ALUMNI: new Set() };

  asignados.forEach(a => {
    if (a.premio === "UE" || a.premio === "ALUMNI") {
      ocupados[a.premio].add(String(a.puesto || "").toUpperCase());
    }
  });

  return {
    UE: todos.UE.filter(p => !ocupados.UE.has(p)),
    ALUMNI: todos.ALUMNI.filter(p => !ocupados.ALUMNI.has(p))
  };
}

/* =========================
   PINTAR PREMIOS ASIGNADOS (BONITO)
========================= */
function pintarAsignados(asignados) {
  const cont = document.getElementById("premiosAsignados");
  if (!cont) return;

  const ue = asignados.filter(a => a.premio === "UE");
  const al = asignados.filter(a => a.premio === "ALUMNI");

  cont.innerHTML = `
    <div class="premios-grid">
      ${renderBloqueAsignado("Mejor cortometraje UE", ue, ["PRIMERO","SEGUNDO","TERCERO"])}
      ${renderBloqueAsignado("Mejor cortometraje Alumni", al, ["PRIMERO","SEGUNDO"])}
    </div>
  `;
}

function renderBloqueAsignado(titulo, asignados, puestosOrden) {
  const map = new Map();
  asignados.forEach(a => map.set(a.puesto, a));

  const filas = puestosOrden.map(p => {
    const row = map.get(p);
    return `
      <div class="premio-row">
        <div class="premio-puesto">${prettyPuesto(p)}</div>
        <div class="premio-ganador">${row ? escapeHtml(row.nombre_responsable) : "<span class='pendiente'>Pendiente</span>"}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="premio-card">
      <h3>${titulo}</h3>
      ${filas}
    </div>
  `;
}

function prettyPuesto(p) {
  if (p === "PRIMERO") return "🥇 Primer premio";
  if (p === "SEGUNDO") return "🥈 Segundo premio";
  if (p === "TERCERO") return "🥉 Tercer premio";
  return p;
}

/* =========================
   HONORÍFICO (MOSTRAR SI YA EXISTE)
========================= */
function pintarHonorificoAsignado(hon) {
  const cont = document.getElementById("honorificoAsignado");
  if (!cont) return;

  if (!hon) {
    cont.innerHTML = `<div class="pendiente">Premio honorífico pendiente</div>`;
    return;
  }

  cont.innerHTML = `
    <div class="hon-card">
      <h3>⭐ Premio Honorífico</h3>
      <div class="hon-nombre">${escapeHtml(hon.nombre)}</div>
      <div class="hon-desc">${escapeHtml(hon.descripcion)}</div>
      ${hon.enlace ? `<a class="hon-link" href="${hon.enlace}" target="_blank">Más información</a>` : ""}
      <div class="hon-edit-hint">Puedes editarlo desde el formulario de abajo.</div>
    </div>
  `;

  // Pre-rellenar formulario para editar
  const n = document.getElementById("honNombre");
  const d = document.getElementById("honDesc");
  const l = document.getElementById("honLink");
  if (n && d && l) {
    n.value = hon.nombre || "";
    d.value = hon.descripcion || "";
    l.value = hon.enlace || "";
  }
}

/* =========================
   CONFIGURAR SELECT DE PUESTOS
   (solo puestos libres)
========================= */
function configurarSelectPuestos(libres) {
  const ueSel = document.getElementById("uePuesto");
  const alSel = document.getElementById("alumniPuesto");

  if (ueSel) {
    ueSel.innerHTML = libres.UE.map(p => `<option value="${p}">${prettyPuesto(p)}</option>`).join("");
  }
  if (alSel) {
    alSel.innerHTML = libres.ALUMNI.map(p => `<option value="${p}">${prettyPuesto(p)}</option>`).join("");
  }
}

/* =========================
   OCULTAR / MOSTRAR BLOQUE ASIGNACIÓN
========================= */
function toggleBloqueAsignacion(premio, visible) {
  const id = premio === "UE" ? "bloqueAsignacionUE" : "bloqueAsignacionALUMNI";
  const bloque = document.getElementById(id);
  if (!bloque) return;

  bloque.style.display = visible ? "block" : "none";

  // si se oculta, mostramos un mensaje bonito de "completo"
  const msgId = premio === "UE" ? "msgUECompleto" : "msgALCompleto";
  const msg = document.getElementById(msgId);
  if (msg) msg.style.display = visible ? "none" : "block";
}

/* =========================
   CARGAR NOMINADOS
========================= */
function cargarNominados(premio) {
  fetch(`${URL_PREMIOS}?accion=nominados&premio=${premio}`, { credentials:"same-origin" })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) return alert(data.error);

      const sel = premio === "UE"
        ? document.getElementById("ueNominado")
        : document.getElementById("alumniNominado");

      if (!sel) return;

      sel.innerHTML = "";
      (data.nominados || []).forEach(n => {
        const o = document.createElement("option");
        o.value = n.id_inscripcion;
        o.textContent = n.nombre_responsable;
        sel.appendChild(o);
      });
    });
}

/* =========================
   ASIGNAR PREMIOS
========================= */
function asignarPremioUE() {
  asignar("UE", document.getElementById("uePuesto")?.value, document.getElementById("ueNominado")?.value);
}
function asignarPremioAlumni() {
  asignar("ALUMNI", document.getElementById("alumniPuesto")?.value, document.getElementById("alumniNominado")?.value);
}

function asignar(premio, puesto, id) {
  if (!puesto || !id) return alert("Selecciona puesto y nominado");

  const fd = new FormData();
  fd.append("accion", "asignar");
  fd.append("premio", premio);
  fd.append("puesto", puesto);
  fd.append("id_inscripcion", id);

  fetch(URL_PREMIOS, { method:"POST", credentials:"same-origin", body:fd })
    .then(r => r.json())
    .then(res => {
      if (!res.ok) return alert(res.error);
      alert("Premio asignado correctamente");
      cargarPanelPremios(); // 🔥 recargar todo para actualizar UI
    });
}

/* =========================
   PREMIO HONORÍFICO (editar único)
========================= */
function guardarHonorifico() {
  const fd = new FormData();
  fd.append("accion","honorifico_save");
  fd.append("nombre",document.getElementById("honNombre").value);
  fd.append("descripcion",document.getElementById("honDesc").value);
  fd.append("enlace",document.getElementById("honLink").value);

  fetch(URL_PREMIOS,{method:"POST",credentials:"same-origin",body:fd})
    .then(r=>r.json())
    .then(res=>{
      if(!res.ok) return alert(res.error);
      alert("Premio honorífico guardado");
      cargarPanelPremios();
    });
}

/* =========================
   UTIL
========================= */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
