const BASE_PATH = (() => {
    const p = window.location.pathname || "";
    const idx = p.indexOf("/public/");
    if (idx !== -1) return p.substring(0, idx);
    return "/ProyectoIntegrador2"; // fallback
})();

const URL_INS = `${BASE_PATH}/app/controllers/InscripcionController.php`;

let candidaturaSeleccionada = null;
let rechazoId = null;

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    // Solo arrancamos si estamos en el panel de candidaturas
    if (!document.getElementById("AlumnoPendientes")) return;
    cargarCandidaturas();
});

/* =========================
   CARGAR CANDIDATURAS
========================= */
function cargarCandidaturas() {
    fetch(`${URL_INS}?accion=listar`, { credentials: "same-origin" })
        .then(r => r.json())
        .then(data => {
            if (!data.ok) {
                showModal(data.error || "Error al cargar candidaturas");
                return;
            }

            // Contenedores por tipo y estado
            const contenedores = {
                Alumno: {
                    PENDIENTE: document.getElementById("AlumnoPendientes"),
                    ACEPTADO: document.getElementById("AlumnoAceptadas"),
                    NOMINADO: document.getElementById("AlumnoNominadas"),
                    RECHAZADO: document.getElementById("AlumnoRechazadas"),
                },
                Alumni: {
                    PENDIENTE: document.getElementById("AlumniPendientes"),
                    ACEPTADO: document.getElementById("AlumniAceptadas"),
                    NOMINADO: document.getElementById("AlumniNominadas"),
                    RECHAZADO: document.getElementById("AlumniRechazadas"),
                }
            };

            // Limpiar todos
            Object.values(contenedores).forEach(grupo => {
                Object.values(grupo).forEach(div => {
                    if (div) div.innerHTML = "";
                });
            });

            (data.candidaturas || []).forEach(c => {
                const tipo = String(c.tipo_participante || "").trim();
                const estado = String(c.estado || "").trim().toUpperCase();

                if (!contenedores[tipo] || !contenedores[tipo][estado]) {
                    console.warn("Candidatura sin contenedor:", c);
                    return;
                }

                const card = document.createElement("div");
                card.className = "news-card candidatura-card";
                card.innerHTML = `
                    <div>
                        <strong>${c.usuario ?? "Sin usuario"}</strong><br>
                        <span class="estado-badge ${estado.toLowerCase()}">${estado}</span>
                    </div>
                    <div class="ver-mas">Ver</div>
                `;

                card.addEventListener("click", () => abrirModalDetalle(c));
                contenedores[tipo][estado].appendChild(card);
            });
        })
        .catch(err => {
            console.error(err);
            showModal("Error al cargar candidaturas");
        });
}

/* =========================
   MODAL DETALLE
========================= */
function abrirModalDetalle(c) {
    candidaturaSeleccionada = c;

    const cont = document.getElementById("detalleContenido");
    const acciones = document.getElementById("detalleAcciones");

    cont.innerHTML = "";
    acciones.innerHTML = "";

    cont.innerHTML = `
      <div class="detalle-item">
    <div class="detalle-label">Usuario</div><br>
    <div class="detalle-valor">${c.usuario}</div>
  </div>

  <div class="detalle-item">
    <div class="detalle-label">Email</div>
    <div class="detalle-valor">${c.email}</div>
  </div>

  <div class="detalle-item">
    <div class="detalle-label">Tipo participante</div>
    <div class="detalle-valor">${c.tipo_participante}</div>
  </div>

  <div class="detalle-item">
    <div class="detalle-label">Estado</div>
    <div class="detalle-valor">
      <span class="estado-badge ${c.estado.toLowerCase()}">
        ${c.estado}
      </span>
    </div>
  </div>

  <div class="detalle-divider"></div>

  <div class="detalle-item detalle-wide">
    <div class="detalle-label">Sinopsis</div>
    <div class="detalle-valor">${c.sinopsis}</div>
  </div>

  <div class="detalle-item detalle-wide">
    <div class="detalle-label">Vídeo</div>
    <div class="detalle-valor">
      <a href="${c.video}" target="_blank">Ver vídeo</a>
    </div>
  </div>
`;

    const estado = String(c.estado || "").trim().toUpperCase();

    if (estado === "PENDIENTE") {
        acciones.appendChild(btnModal("Aceptar", () => aceptarCandidatura(c.id_inscripcion)));
        acciones.appendChild(btnModal("Rechazar", () => abrirModalRechazo(c.id_inscripcion), true));
    } else if (estado === "ACEPTADO") {
        acciones.appendChild(btnModal("Nominar", () => nominarCandidatura(c.id_inscripcion)));
    } else if (estado === "RECHAZADO") {
        acciones.appendChild(btnModal("Ver motivo", () => abrirModalMotivo(c.motivo_rechazo || "Sin motivo")));
    }
    // NOMINADO → sin acciones

    document.getElementById("modalDetalle").classList.remove("hidden");
}

function cerrarModalDetalle() {
    candidaturaSeleccionada = null;
    document.getElementById("modalDetalle").classList.add("hidden");
}

/* =========================
   BOTONES
========================= */
function btnModal(texto, fn, danger = false) {
    const b = document.createElement("button");
    b.className = "button" + (danger ? " btn-danger" : "");
    b.textContent = texto;
    b.onclick = fn;
    return b;
}

/* =========================
   ACCIONES BACKEND
========================= */
function aceptarCandidatura(id) {
    fetch(`${URL_INS}?accion=aceptar&id=${id}`, { credentials: "same-origin" })
        .then(r => r.json())
        .then(res => {
            if (!res.ok) {
                showModal(res.error || "Error al aceptar");
                return;
            }
            cerrarModalDetalle();
            cargarCandidaturas();
        });
}

function nominarCandidatura(id) {
    fetch(`${URL_INS}?accion=nominar&id=${id}`, { credentials: "same-origin" })
        .then(r => r.json())
        .then(res => {
            if (!res.ok) {
                showModal(res.error || "Error al nominar");
                return;
            }
            cerrarModalDetalle();
            cargarCandidaturas();
        });
}

/* =========================
   MODAL RECHAZO
========================= */
function abrirModalRechazo(id) {
    rechazoId = id;
    document.getElementById("motivoRechazo").value = "";
    document.getElementById("modalRechazo").classList.remove("hidden");
}

function cerrarModalRechazo() {
    rechazoId = null;
    document.getElementById("modalRechazo").classList.add("hidden");
}

function confirmarRechazo() {
    const motivo = document.getElementById("motivoRechazo").value.trim();
    if (!motivo) {
        showModal("Debes escribir un motivo");
        return;
    }

    const fd = new FormData();
    fd.append("accion", "rechazar");
    fd.append("id", rechazoId);
    fd.append("motivo", motivo);

    fetch(URL_INS, { method: "POST", credentials: "same-origin", body: fd })
        .then(r => r.json())
        .then(res => {
            if (!res.ok) {
                showModal(res.error || "Error al rechazar");
                return;
            }
            cerrarModalRechazo();
            cerrarModalDetalle();
            cargarCandidaturas();
        });
}

/* =========================
   MODAL MOTIVO
========================= */
function abrirModalMotivo(texto) {
    document.getElementById("textoMotivo").textContent = texto;
    document.getElementById("modalMotivo").classList.remove("hidden");
}

function cerrarModalMotivo() {
    document.getElementById("modalMotivo").classList.add("hidden");
}

/* =========================
   UTIL
========================= */
function extraerNombre(path) {
    if (!path) return "";
    return path.split("/").pop();
}
