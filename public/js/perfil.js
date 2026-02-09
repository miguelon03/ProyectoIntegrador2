const URL_PERFIL = "/ProyectoIntegrador2/app/controllers/PerfilController.php";
const URL_INS = "/ProyectoIntegrador2/app/controllers/InscripcionController.php";

document.addEventListener("DOMContentLoaded", () => {
  cargarPerfil();

  const form = document.getElementById("formReenviar");
  if (form) {
    form.addEventListener("submit", reenviarCandidatura);
  }
});

function cargarPerfil() {
  fetch(URL_PERFIL, { credentials: "same-origin" })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        alert("No autorizado");
        return;
      }

      // datos personales
      const ul = document.getElementById("datosPersonales");
      if (ul) {
        ul.innerHTML = `
          <li><strong>Usuario:</strong> ${data.usuario ?? "-"}</li>
          <li><strong>Email:</strong> ${data.email ?? "-"}</li>
          <li><strong>DNI:</strong> ${data.dni ?? "-"}</li>
          <li><strong>Expediente:</strong> ${data.expediente ?? "-"}</li>
        `;
      }

      // candidaturas (aquí normalmente es 0 o 1)
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
          <p style="margin-top:8px;"><em>Haz click para ver/editar y reenviar</em></p>
        </div>
      `;
    })
    .catch(err => {
      console.error(err);
      alert("Error al cargar el perfil");
    });
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

      document.getElementById("detNombre").value = ins.nombre_responsable ?? "";
      document.getElementById("detEmail").value = ins.email ?? "";
      document.getElementById("detDni").value = ins.dni ?? "";
      document.getElementById("detExpediente").value = ins.expediente ?? "";
      document.getElementById("detSinopsis").value = ins.sinopsis ?? "";
      document.getElementById("detVideo").value = ins.video ?? "";

      // links ficha/cartel actuales
      const lf = document.getElementById("linkFicha");
      const lc = document.getElementById("linkCartel");

      lf.innerHTML = ins.ficha ? `Actual: <a href="${ins.ficha}" target="_blank" download>Descargar ficha</a>` : "";
      lc.innerHTML = ins.cartel ? `Actual: <a href="${ins.cartel}" target="_blank" download>Descargar cartel</a>` : "";

      // estado/motivo
      document.getElementById("detEstado").innerHTML = `<strong>Estado actual:</strong> ${ins.estado ?? "-"}`;

      const motivo = document.getElementById("detMotivo");
      if ((ins.estado || "").toUpperCase() === "RECHAZADO" && ins.motivo_rechazo) {
        motivo.style.display = "block";
        motivo.innerHTML = `<strong>Motivo rechazo:</strong> ${ins.motivo_rechazo}`;
      } else {
        motivo.style.display = "none";
        motivo.textContent = "";
      }

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
