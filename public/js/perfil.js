const URL_PERFIL = "/ProyectoIntegrador2/app/controllers/PerfilController.php";
const URL_INS = "/ProyectoIntegrador2/app/controllers/InscripcionController.php";

let _estadoCandidaturaActual = null;

document.addEventListener("DOMContentLoaded", () => {
  cargarPerfil();

  const formReenviar = document.getElementById("formReenviar");
  if (formReenviar) formReenviar.addEventListener("submit", reenviarCandidatura);

  const formPerfil = document.getElementById("formPerfil");
  if (formPerfil) formPerfil.addEventListener("submit", guardarPerfil);
});

/* =========================
   TOGGLE EDITAR PERFIL
========================= */
function toggleEditarPerfil(forzar) {
  const sec = document.getElementById("seccionEditarPerfil");
  if (!sec) return;

  const visibleActual = sec.style.display !== "none";
  const mostrar = (typeof forzar === "boolean") ? forzar : !visibleActual;

  sec.style.display = mostrar ? "block" : "none";

  if (mostrar) {
    sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function cargarPerfil() {
  fetch(URL_PERFIL, { credentials: "same-origin" })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        alert("No autorizado");
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

      // form editar perfil (rellenamos siempre, aunque esté oculto)
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

      // candidaturas (mostrar la más reciente)
      const cont = document.getElementById("misCandidaturas");
      if (!cont) return;

      cont.innerHTML = "";

      if (!data.candidaturas || data.candidaturas.length === 0) {
        cont.innerHTML = "<p>No tienes candidaturas.</p>";
        return;
      }

      const c = data.candidaturas[0];

      cont.innerHTML = `
        <div class="candidatura-card" onclick="abrirMiDetalle()">
          <p><strong>Estado:</strong> <span class="estado">${c.estado}</span></p>
          <p><strong>Vídeo:</strong> ${c.video ? `<a href="${c.video}" target="_blank">Ver vídeo</a>` : "—"}</p>
          <p style="margin-top:8px;"><em>Haz click para ver detalle</em></p>
        </div>
      `;
    })
    .catch(err => {
      console.error(err);
      alert("Error al cargar el perfil");
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
  if (msg) msg.textContent = "";

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

  fetch(URL_PERFIL, {
    method: "POST",
    credentials: "same-origin",
    body: fd
  })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        if (msg) msg.textContent = data.error || "Error al guardar";
        return;
      } if (msg) {
        msg.textContent = "Cambios guardados correctamente.";
        msg.style.color = "green";
      }

      // Recargamos datos SIN borrar el mensaje
      cargarPerfil();

      // Ocultar el mensaje tras 4 segundos
      setTimeout(() => {
        if (msg) msg.textContent = "";
      }, 4000);

    })
    .catch(err => {
      console.error(err);
      if (msg) msg.textContent = "Error de red al guardar";
    });
}

/* =========================
   DETALLE / REENVÍO CANDIDATURA
   - Solo editable si estado = RECHAZADO
   - Sin datos personales visibles
========================= */
function setCandidaturaEditable(esEditable) {
  const form = document.getElementById("formReenviar");
  if (!form) return;

  // Solo habilitamos lo “de candidatura”
  const campos = [
    document.getElementById("detSinopsis"),
    document.getElementById("detVideo"),
    ...form.querySelectorAll("input[type='file']")
  ];

  campos.forEach(c => {
    if (c) c.disabled = !esEditable;
  });

  const btn = document.getElementById("btnReenviar");
  const info = document.getElementById("infoEdicionCandidatura");

  if (esEditable) {
    if (btn) btn.style.display = "inline-block";
    if (info) { info.style.display = "none"; info.textContent = ""; }
  } else {
    if (btn) btn.style.display = "none";
    if (info) {
      info.style.display = "block";
      info.textContent = "Solo puedes editar y reenviar la candidatura cuando está RECHAZADA.";
    }
  }
}

function abrirMiDetalle() {
  fetch(`${URL_INS}?accion=mi_detalle`, { credentials: "same-origin" })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        alert(data.error || "Error");
        return;
      }

      const ins = data.inscripcion;
      if (!ins) {
        alert("No tienes inscripción");
        return;
      }

      document.getElementById("msgReenviar").textContent = "";

      // ✅ Guardamos datos personales en hidden (no visibles)
      document.getElementById("detNombreHidden").value = ins.nombre_responsable ?? "";
      document.getElementById("detEmailHidden").value = ins.email ?? "";
      document.getElementById("detDniHidden").value = ins.dni ?? "";
      document.getElementById("detExpedienteHidden").value = ins.expediente ?? "";

      // Solo candidatura editable
      document.getElementById("detSinopsis").value = ins.sinopsis ?? "";
      document.getElementById("detVideo").value = ins.video ?? "";

      // links ficha/cartel actuales
      const lf = document.getElementById("linkFicha");
      const lc = document.getElementById("linkCartel");

      lf.innerHTML = ins.ficha ? `Actual: <a href="${ins.ficha}" target="_blank" download>Descargar ficha</a>` : "";
      lc.innerHTML = ins.cartel ? `Actual: <a href="${ins.cartel}" target="_blank" download>Descargar cartel</a>` : "";

      // estado/motivo
      const estado = (ins.estado || "").toUpperCase();
      _estadoCandidaturaActual = estado;

      document.getElementById("detEstado").innerHTML = `<strong>Estado actual:</strong> ${ins.estado ?? "-"}`;

      const motivo = document.getElementById("detMotivo");
      if (estado === "RECHAZADO" && ins.motivo_rechazo) {
        motivo.style.display = "block";
        motivo.innerHTML = `<strong>Motivo rechazo:</strong> ${ins.motivo_rechazo}`;
      } else {
        motivo.style.display = "none";
        motivo.textContent = "";
      }

      // ✅ solo editable si RECHAZADO
      setCandidaturaEditable(estado === "RECHAZADO");

      document.getElementById("modalDetalle").classList.remove("hidden");
    })
    .catch(err => {
      console.error(err);
      alert("Error al cargar detalle");
    });
}

function cerrarModalDetalle() {
  document.getElementById("modalDetalle").classList.add("hidden");
}

function reenviarCandidatura(e) {
  e.preventDefault();

  if ((_estadoCandidaturaActual || "").toUpperCase() !== "RECHAZADO") {
    const msg = document.getElementById("msgReenviar");
    if (msg) msg.textContent = "Solo puedes reenviar si tu candidatura está RECHAZADA.";
    return;
  }

  const form = e.target;
  const fd = new FormData(form);
  fd.append("accion", "actualizar");

  fetch(URL_INS, {
    method: "POST",
    credentials: "same-origin",
    body: fd
  })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        document.getElementById("msgReenviar").textContent = data.error || "Error";
        return;
      }

      cerrarModalDetalle();
      cargarPerfil();
      alert("Reenviado. Tu candidatura vuelve a PENDIENTE.");
    })
    .catch(err => {
      console.error(err);
      document.getElementById("msgReenviar").textContent = "Error al reenviar";
    });
}
