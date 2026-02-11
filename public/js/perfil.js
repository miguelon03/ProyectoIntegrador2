const BASE_PATH = (() => {
  // Ej: /ProyectoIntegrador2/public/html/perfil.html  ->  /ProyectoIntegrador2
  const p = window.location.pathname || "";
  const idx = p.indexOf("/public/");
  if (idx > 0) return p.substring(0, idx);
  return "/ProyectoIntegrador2"; // fallback
})();

const URL_PERFIL = `${BASE_PATH}/app/controllers/PerfilController.php`;
const URL_INS = `${BASE_PATH}/app/controllers/InscripcionController.php`;

let _candidaturas = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarPerfil();
  contarCandidaturasParaBoton();

  const formPerfil = document.getElementById("formPerfil");
  if (formPerfil) formPerfil.addEventListener("submit", guardarPerfil);

  const formNueva = document.getElementById("formNuevaCandidatura");
  if (formNueva) formNueva.addEventListener("submit", enviarSegundaCandidatura);

  const formReenviar = document.getElementById("formReenviarCandidatura");
  if (formReenviar) formReenviar.addEventListener("submit", reenviarCandidatura);
});

/* =========================
   HELPERS
========================= */
function fetchJson(url, options) {
  return fetch(url, options).then(async (r) => {
    const txt = await r.text();
    try {
      return JSON.parse(txt);
    } catch (e) {
      console.error("Respuesta no JSON:", txt);
      throw new Error("Respuesta no JSON");
    }
  });
}

function normalizarRuta(ruta) {
  if (!ruta) return "";
  let p = String(ruta);

  // Si es URL completa
  if (p.startsWith("http://") || p.startsWith("https://")) return p;

  // Si viene con /ProyectoIntegrador2 pero el BASE_PATH es otro, lo adaptamos
  if (p.startsWith("/ProyectoIntegrador2/") && BASE_PATH !== "/ProyectoIntegrador2") {
    p = BASE_PATH + p.substring("/ProyectoIntegrador2".length);
  }

  return p;
}

function badgeEstado(estado) {
  const e = String(estado || "-").trim();
  const cls = e.toLowerCase();
  return `<span class="estado ${cls}">${e}</span>`;
}

function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt || "";
}

/* =========================
   BOTÓN "AÑADIR CANDIDATURA" (solo si total == 1)
========================= */
function contarCandidaturasParaBoton() {
  fetchJson(`${URL_INS}?accion=contar`, { credentials: "same-origin" })
    .then((data) => {
      const btn = document.getElementById("btnNuevaCandidatura");
      if (!btn) return;

      const total = Number(data.total || 0);

      // Mostrar SOLO si tiene exactamente 1 candidatura (permitimos crear la 2ª)
      if (data.ok && total === 1) btn.style.display = "inline-block";
      else btn.style.display = "none";
    })
    .catch(() => {
      const btn = document.getElementById("btnNuevaCandidatura");
      if (btn) btn.style.display = "none";
    });
}

/* =========================
   MODAL NUEVA CANDIDATURA
========================= */
function getMsgNuevaCandidatura() {
  return (
    document.getElementById("errorNuevaCandidatura") ||
    document.getElementById("msgNuevaCandidatura")
  );
}

function setMsgNuevaCandidatura(texto) {
  const el = getMsgNuevaCandidatura();
  if (el) el.textContent = texto || "";
}

function mostrarNuevaCandidatura() {
  const m = document.getElementById("modalNuevaCandidatura");
  const form = document.getElementById("formNuevaCandidatura");

  setMsgNuevaCandidatura("");

  if (form) form.reset();
  if (m) m.classList.remove("hidden");
}

function cerrarNuevaCandidatura() {
  const m = document.getElementById("modalNuevaCandidatura");
  if (m) m.classList.add("hidden");
}

// Alias (tu HTML llama a esto)
function cerrarModalNuevaCandidatura() {
  cerrarNuevaCandidatura();
}

/* =========================
   ENVIAR 2ª CANDIDATURA
========================= */
function enviarSegundaCandidatura(e) {
  e.preventDefault();

  const form = e.target;
  setMsgNuevaCandidatura("");

  const tipo = form.tipo_participante?.value?.trim() || "";
  const sinopsis = form.sinopsis?.value?.trim() || "";
  const video = form.video?.value?.trim() || "";

  if (tipo !== "Alumno" && tipo !== "Alumni") {
    setMsgNuevaCandidatura("Debes seleccionar Alumno o Alumni.");
    return;
  }
  if (!sinopsis) {
    setMsgNuevaCandidatura("Sinopsis obligatoria.");
    return;
  }
  if (!video || !video.startsWith("http")) {
    setMsgNuevaCandidatura("El vídeo debe ser un enlace válido (http/https).");
    return;
  }
  if (!form.ficha?.files?.length || !form.cartel?.files?.length) {
    setMsgNuevaCandidatura("Ficha y cartel son obligatorios.");
    return;
  }

  const fd = new FormData(form);
  fd.append("accion", "crear_segunda");

  const btnSubmit = form.querySelector("button[type='submit']");
  const txtOld = btnSubmit ? btnSubmit.textContent : "";
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Enviando...";
  }

  fetchJson(URL_INS, {
    method: "POST",
    credentials: "same-origin",
    body: fd
  })
    .then((data) => {
      if (!data.ok) {
        setMsgNuevaCandidatura(data.error || "Error al enviar la candidatura.");
        return;
      }

      cerrarNuevaCandidatura();
      cargarPerfil();
      contarCandidaturasParaBoton();
      showModal("Segunda candidatura enviada correctamente.", { title: "¡Listo!" });
    })
    .catch((err) => {
      console.error(err);
      setMsgNuevaCandidatura("Error de red/servidor al enviar la candidatura.");
    })
    .finally(() => {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = txtOld || "Enviar candidatura";
      }
    });
}

/* =========================
   TOGGLE EDITAR PERFIL
========================= */
function toggleEditarPerfil(forzar) {
  const sec = document.getElementById("seccionEditarPerfil");
  if (!sec) return;

  const visibleActual = sec.style.display !== "none";
  const mostrar = typeof forzar === "boolean" ? forzar : !visibleActual;

  sec.style.display = mostrar ? "block" : "none";

  if (mostrar) {
    sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* =========================
   CARGAR PERFIL + LISTA CANDIDATURAS
========================= */
function cargarPerfil() {
  fetchJson(URL_PERFIL, { credentials: "same-origin" })
    .then((data) => {
      if (!data.ok) {
        showModal("No autorizado", { title: "Acceso denegado" });
        return;
      }

      // datos personales (solo lectura)
      const ul = document.getElementById("datosPersonales");
      if (ul) {
        ul.innerHTML = `
          <li><strong>Usuario:</strong> ${data.usuario ?? "-"}</li>
          <li><strong>Email:</strong> ${data.email ?? "-"}</li>
          <li><strong>DNI:</strong> ${data.dni ?? "-"}</li>
          <li><strong>Expediente:</strong> ${data.expediente ?? "-"}</li>
        `;
      }

      // form editar perfil
      const inUser = document.getElementById("perfilUsuario");
      const inEmail = document.getElementById("perfilEmail");
      const inDni = document.getElementById("perfilDni");
      const inExp = document.getElementById("perfilExpediente");
      const inPass = document.getElementById("perfilContrasena");

      if (inUser) inUser.value = data.usuario ?? "";
      if (inEmail) inEmail.value = data.email ?? "";
      if (inDni) inDni.value = data.dni ?? "";
      if (inExp) inExp.value = data.expediente ?? "";
      if (inPass) inPass.value = "";

      // candidaturas
      const cont = document.getElementById("misCandidaturas");
      if (!cont) return;

      cont.innerHTML = "";

      _candidaturas = Array.isArray(data.candidaturas) ? data.candidaturas : [];

      if (_candidaturas.length === 0) {
        cont.innerHTML = "<p>No tienes candidaturas.</p>";
        return;
      }

      _candidaturas.forEach((c, i) => {
        const estado = String(c.estado || "-").trim();
        const tipo = c.tipo_participante ? String(c.tipo_participante) : "-";
        const fecha = c.fecha ? String(c.fecha) : "";

        const card = document.createElement("div");
        card.className = "candidatura-card";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");

        const videoHtml = c.video
          ? `<a href="${c.video}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Ver vídeo</a>`
          : "—";

        card.innerHTML = `
          <div class="candidatura-meta">
            <div>
              <h3>Candidatura ${i + 1} / ${_candidaturas.length}</h3>
              <p><strong>Tipo:</strong> ${tipo}</p>
              ${fecha ? `<p><strong>Fecha:</strong> ${fecha}</p>` : ""}
            </div>
            <div>
              ${badgeEstado(estado)}
            </div>
          </div>

          <div class="candidatura-links">
            <p><strong>Vídeo:</strong> ${videoHtml}</p>
            <p class="muted"><em>Click para ver detalle</em></p>
          </div>
        `;

        card.addEventListener("click", () => abrirDetalleCandidatura(c.id_inscripcion));
        card.addEventListener("keypress", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") abrirDetalleCandidatura(c.id_inscripcion);
        });

        cont.appendChild(card);
      });
    })
    .catch((err) => {
      console.error(err);
      showModal("Error al cargar el perfil", { title: "Error" });
    });
}

/* =========================
   MODAL DETALLE CANDIDATURA + REENVIAR
========================= */
function abrirDetalleCandidatura(id) {
  const c = _candidaturas.find(x => Number(x.id_inscripcion) === Number(id));
  if (!c) {
    showModal("No se encontró la candidatura.", { title: "Error" });
    return;
  }

  const estado = String(c.estado || "").trim().toUpperCase();

  // Info (solo lectura)
  const info = document.getElementById("detalleCandidaturaInfo");
  const ficha = normalizarRuta(c.ficha);
  const cartel = normalizarRuta(c.cartel);

  const linkFicha = ficha
    ? `<a href="${ficha}" target="_blank" rel="noopener" download>Descargar ficha</a>`
    : "—";

  const linkCartel = cartel
    ? `<a href="${cartel}" target="_blank" rel="noopener" download>Descargar cartel</a>`
    : "—";

  if (info) {
    info.innerHTML = `
      <div class="detalle-grid">
        <div><strong>ID:</strong> ${c.id_inscripcion ?? "-"}</div>
        <div><strong>Estado:</strong> ${badgeEstado(c.estado)}</div>
        <div><strong>Tipo:</strong> ${c.tipo_participante ?? "-"}</div>
        <div><strong>Email:</strong> ${c.email ?? "-"}</div>

        <div class="detalle-wide"><strong>Vídeo:</strong> ${
          c.video ? `<a href="${c.video}" target="_blank" rel="noopener">Ver vídeo</a>` : "—"
        }</div>

        <div class="detalle-wide"><strong>Ficha:</strong> ${linkFicha}</div>
        <div class="detalle-wide"><strong>Cartel:</strong> ${linkCartel}</div>

        <div class="detalle-wide"><strong>Sinopsis:</strong><br>${c.sinopsis ?? "-"}</div>
      </div>
    `;
  }

  // Motivo rechazo
  const bloqueMotivo = document.getElementById("bloqueMotivoRechazo");
  const txtMotivo = document.getElementById("detalleMotivoRechazo");

  if (estado === "RECHAZADO" && c.motivo_rechazo) {
    if (bloqueMotivo) bloqueMotivo.classList.remove("hidden");
    if (txtMotivo) txtMotivo.textContent = c.motivo_rechazo;
  } else {
    if (bloqueMotivo) bloqueMotivo.classList.add("hidden");
    if (txtMotivo) txtMotivo.textContent = "";
  }

  // Form reenviar (solo si RECHAZADO)
  const form = document.getElementById("formReenviarCandidatura");
  const msg = document.getElementById("msgReenviar");
  if (msg) msg.textContent = "";

  if (form) {
    if (estado === "RECHAZADO") {
      form.classList.remove("hidden");
      document.getElementById("detIdInscripcion").value = c.id_inscripcion ?? "";
      document.getElementById("detSinopsis").value = c.sinopsis ?? "";
      document.getElementById("detVideo").value = c.video ?? "";

      const linkFichaActual = document.getElementById("linkFichaActual");
      const linkCartelActual = document.getElementById("linkCartelActual");
      if (linkFichaActual) linkFichaActual.innerHTML = linkFicha;
      if (linkCartelActual) linkCartelActual.innerHTML = linkCartel;

      // limpiamos inputs file
      const detFicha = document.getElementById("detFicha");
      const detCartel = document.getElementById("detCartel");
      if (detFicha) detFicha.value = "";
      if (detCartel) detCartel.value = "";

    } else {
      form.classList.add("hidden");
    }
  }

  // mostrar modal
  const modal = document.getElementById("modalDetalleCandidatura");
  if (modal) modal.classList.remove("hidden");
}

function cerrarModalDetalleCandidatura() {
  const modal = document.getElementById("modalDetalleCandidatura");
  if (modal) modal.classList.add("hidden");
}

function cerrarModalDetalleCandidaturaPorClickFuera(e) {
  const modal = document.getElementById("modalDetalleCandidatura");
  if (modal && e.target === modal) cerrarModalDetalleCandidatura();
}
// Cerrar al clicar fuera
document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalDetalleCandidatura");
  if (modal && !modal.classList.contains("hidden") && e.target === modal) {
    cerrarModalDetalleCandidatura();
  }
});

/* =========================
   REENVIAR (solo RECHAZADA)
========================= */
function reenviarCandidatura(e) {
  e.preventDefault();

  const form = e.target;
  const msg = document.getElementById("msgReenviar");
  if (msg) msg.textContent = "";

  const idIns = document.getElementById("detIdInscripcion")?.value || "";
  const sinopsis = document.getElementById("detSinopsis")?.value?.trim() || "";
  const video = document.getElementById("detVideo")?.value?.trim() || "";

  if (!idIns) {
    if (msg) msg.textContent = "No se ha podido identificar la candidatura.";
    return;
  }

  // ✅ Seguridad extra: aunque alguien manipule el DOM, solo permitimos reenviar si está RECHAZADA
  const c = _candidaturas.find(x => Number(x.id_inscripcion) === Number(idIns));
  const estado = String(c?.estado || "").trim().toUpperCase();
  if (estado !== "RECHAZADO" && estado !== "RECHAZADA") {
    if (msg) msg.textContent = "Solo puedes reenviar si tu candidatura está RECHAZADA.";
    showModal("Solo puedes reenviar si tu candidatura está RECHAZADA.", { title: "No permitido" });
    return;
  }
  if (!sinopsis) {
    if (msg) msg.textContent = "Sinopsis obligatoria.";
    return;
  }
  if (!video || !video.startsWith("http")) {
    if (msg) msg.textContent = "El vídeo debe ser un enlace válido (http/https).";
    return;
  }

  const fd = new FormData(form);
  fd.append("accion", "actualizar");

  const btn = form.querySelector("button[type='submit']");
  const oldTxt = btn ? btn.textContent : "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Reenviando...";
  }

  fetchJson(URL_INS, {
    method: "POST",
    credentials: "same-origin",
    body: fd
  })
    .then((data) => {
      if (!data.ok) {
        if (msg) msg.textContent = data.error || "Error al reenviar.";
        return;
      }

      cerrarModalDetalleCandidatura();
      cargarPerfil();
      showModal("Candidatura reenviada. Pasa a estado PENDIENTE.", { title: "Reenviado" });
    })
    .catch((err) => {
      console.error(err);
      if (msg) msg.textContent = "Error de red al reenviar.";
      showModal("Error de red al reenviar.", { title: "Error" });
    })
    .finally(() => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = oldTxt || "Reenviar candidatura";
      }
    });
}

/* =========================
   EDITAR PERFIL
========================= */
function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg || "";
}

function limpiarErroresPerfil() {
  setErr("errPerfilUsuario", "");
  setErr("errPerfilEmail", "");
  setErr("errPerfilDni", "");
  setErr("errPerfilExpediente", "");
  setErr("errPerfilContrasena", "");
}

function validarPerfil({ usuario, email, dni, expediente, contrasena }) {
  limpiarErroresPerfil();
  let ok = true;

  if (!usuario || usuario.trim().length < 3) {
    setErr("errPerfilUsuario", "El usuario debe tener al menos 3 caracteres");
    ok = false;
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
  if (!emailOk) {
    setErr("errPerfilEmail", "Email no válido");
    ok = false;
  }

  const dniUp = (dni || "").trim().toUpperCase();
  if (!/^\d{8}[A-Z]$/.test(dniUp)) {
    setErr("errPerfilDni", "DNI no válido (formato: 12345678Z)");
    ok = false;
  }

  if (!expediente || expediente.trim().length < 4) {
    setErr("errPerfilExpediente", "El expediente debe tener al menos 4 caracteres");
    ok = false;
  }

  if (contrasena && (contrasena.length < 4 || contrasena.length > 12)) {
    setErr("errPerfilContrasena", "La contraseña debe tener entre 4 y 12 caracteres");
    ok = false;
  }

  return ok;
}

function guardarPerfil(e) {
  e.preventDefault();

  const usuario = document.getElementById("perfilUsuario")?.value || "";
  const email = document.getElementById("perfilEmail")?.value || "";
  const dni = document.getElementById("perfilDni")?.value || "";
  const expediente = document.getElementById("perfilExpediente")?.value || "";
  const contrasena = document.getElementById("perfilContrasena")?.value || "";

  const msg = document.getElementById("msgPerfil");
  if (msg) {
    msg.textContent = "";
    msg.style.color = "";
  }

  if (!validarPerfil({ usuario, email, dni, expediente, contrasena })) {
    if (msg) msg.textContent = "Corrige los errores antes de continuar.";
    return;
  }

  const fd = new FormData();
  fd.append("accion", "actualizar_perfil");
  fd.append("usuario", usuario.trim());
  fd.append("email", email.trim());
  fd.append("dni", dni.trim().toUpperCase());
  fd.append("expediente", expediente.trim());
  if (contrasena) fd.append("contrasena", contrasena);

  fetchJson(URL_PERFIL, {
    method: "POST",
    credentials: "same-origin",
    body: fd
  })
    .then((data) => {
      if (!data.ok) {
        if (msg) msg.textContent = data.error || "Error al guardar";
        showModal(data.error || "Error al guardar", { title: "Error" });
        return;
      }
      if (msg) {
        msg.textContent = "Cambios guardados correctamente.";
        msg.style.color = "green";
      }

      cargarPerfil();

      setTimeout(() => {
        if (msg) {
          msg.textContent = "";
          msg.style.color = "";
        }
      }, 4000);

      showModal("Cambios guardados correctamente.", { title: "Perfil actualizado" });
    })
    .catch((err) => {
      console.error(err);
      if (msg) msg.textContent = "Error de red al guardar";
      showModal("Error de red al guardar", { title: "Error" });
    });
}
