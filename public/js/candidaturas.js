const URL_INS = "/ProyectoIntegrador2/app/controllers/InscripcionController.php";

let candidaturaSeleccionada = null;
let rechazoId = null;

/* ============================================
   CARGAR CANDIDATURAS POR TIPO
============================================ */
async function cargarCandidaturas(tipo) {
    try {
        const res = await fetch(`${URL_INS}?accion=listar&tipo=${tipo}`, {
            credentials: "same-origin"
        });

        const json = await res.json();
        if (!json.ok) return;

        const grupos = {
            PENDIENTE: document.getElementById(`${tipo}Pendientes`),
            ACEPTADO: document.getElementById(`${tipo}Aceptadas`),
            NOMINADO: document.getElementById(`${tipo}Nominadas`),
            RECHAZADO: document.getElementById(`${tipo}Rechazadas`)
        };

        Object.values(grupos).forEach(g => g.innerHTML = "");

        (json.candidaturas || []).forEach(c => {
            const card = document.createElement("div");
            card.className = "news-card candidatura-card";

            card.innerHTML = `
                <div>
                    <strong>${c.usuario ?? "Sin usuario"}</strong><br>
                    <span class="estado-badge ${String(c.estado || "").toLowerCase()}">${c.estado}</span>
                </div>
                <div class="ver-mas">Ver</div>
            `;

            card.addEventListener("click", () => abrirModalDetalle(c));

            if (c.estado === "PENDIENTE") grupos.PENDIENTE.appendChild(card);
            else if (c.estado === "ACEPTADO") grupos.ACEPTADO.appendChild(card);
            else if (c.estado === "NOMINADO") grupos.NOMINADO.appendChild(card);
            else if (c.estado === "RECHAZADO") grupos.RECHAZADO.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        alert("Error al cargar candidaturas");
    }
}

/* ============================================
   MODAL DETALLE
============================================ */
function abrirModalDetalle(c) {
    candidaturaSeleccionada = c;

    const cont = document.getElementById("detalleContenido");
    const acciones = document.getElementById("detalleAcciones");

    cont.innerHTML = "";
    acciones.innerHTML = "";

    cont.innerHTML = `
        <p><strong>Usuario:</strong> ${c.usuario ?? "-"}</p>
        <p><strong>Email:</strong> ${c.email ?? "-"}</p>
        <p><strong>DNI:</strong> ${c.dni ?? "-"}</p>
        <p><strong>Expediente:</strong> ${c.expediente ?? "-"}</p>
        <p><strong>Tipo:</strong> ${c.tipo_participante ?? "-"}</p>

        <p><strong>Sinopsis:</strong><br>${c.sinopsis ?? "-"}</p>

        <p><strong>Vídeo:</strong>
            ${c.video ? `<a href="${c.video}" target="_blank">Ver vídeo</a>` : "—"}
        </p>

        <p><strong>Ficha técnica:</strong>
            ${c.ficha ? `<a href="${c.ficha}" target="_blank" download>Descargar ficha</a>` : "—"}
        </p>

        <p><strong>Cartel:</strong>
            ${c.cartel ? `<a href="${c.cartel}" target="_blank" download>Descargar cartel</a>` : "—"}
        </p>

        <p><strong>Estado:</strong> ${c.estado}</p>
    `;

    if (c.estado === "PENDIENTE") {
        acciones.appendChild(btnModal("Aceptar", () => aceptarCandidatura(c.id_inscripcion)));
        acciones.appendChild(btnModal("Nominar", () => nominarCandidatura(c.id_inscripcion)));
        acciones.appendChild(btnModal("Rechazar", () => abrirModalRechazo(c.id_inscripcion), true));
    }

    if (c.estado === "ACEPTADO") {
        acciones.appendChild(btnModal("Nominar", () => nominarCandidatura(c.id_inscripcion)));
        acciones.appendChild(btnModal("Rechazar", () => abrirModalRechazo(c.id_inscripcion), true));
    }

    if (c.estado === "NOMINADO") {
        acciones.appendChild(btnModal("Rechazar", () => abrirModalRechazo(c.id_inscripcion), true));
    }

    if (c.estado === "RECHAZADO") {
        acciones.appendChild(btnModal("Ver motivo", () => abrirModalMotivo(c.motivo_rechazo || "Sin motivo")));
    }

    document.getElementById("modalDetalle").classList.remove("hidden");
}

function cerrarModalDetalle() {
    candidaturaSeleccionada = null;
    document.getElementById("modalDetalle").classList.add("hidden");
}

function btnModal(texto, fn, danger = false) {
    const b = document.createElement("button");
    b.className = "button" + (danger ? " btn-danger" : "");
    b.textContent = texto;
    b.onclick = fn;
    return b;
}

/* ============================================
   ACCIONES BACKEND
============================================ */
function aceptarCandidatura(id) {
    fetch(`${URL_INS}?accion=aceptar&id=${id}`, { credentials: "same-origin" })
        .then(r => r.json())
        .then(res => {
            if (!res.ok) return alert(res.error || "Error al aceptar");
            cerrarModalDetalle();
            recargarListas();
        });
}

function nominarCandidatura(id) {
    fetch(`${URL_INS}?accion=nominar&id=${id}`, { credentials: "same-origin" })
        .then(r => r.json())
        .then(res => {
            if (!res.ok) return alert(res.error || "Error al nominar");
            cerrarModalDetalle();
            recargarListas();
        });
}

/* ============================================
   MODAL RECHAZO
============================================ */
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
    if (!motivo) return alert("Debes escribir un motivo");

    const fd = new FormData();
    fd.append("accion", "rechazar");
    fd.append("id", rechazoId);
    fd.append("motivo", motivo);

    fetch(URL_INS, {
        method: "POST",
        credentials: "same-origin",
        body: fd
    })
        .then(r => r.json())
        .then(res => {
            if (!res.ok) return alert(res.error || "Error al rechazar");
            cerrarModalRechazo();
            cerrarModalDetalle();
            recargarListas();
        });
}

/* ============================================
   MODAL MOTIVO
============================================ */
function abrirModalMotivo(texto) {
    document.getElementById("textoMotivo").textContent = texto;
    document.getElementById("modalMotivo").classList.remove("hidden");
}

function cerrarModalMotivo() {
    document.getElementById("modalMotivo").classList.add("hidden");
}

/* ============================================
   RECARGAR LISTAS
============================================ */
function recargarListas() {
    cargarCandidaturas("Alumno");
    cargarCandidaturas("Alumni");
}

/* ============================================
   INICIO
============================================ */
recargarListas();
