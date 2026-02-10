// Estado de sesión (necesario para no validar campos ocultos)
let TIENE_SESION = false;

document.addEventListener("DOMContentLoaded", () => {
  fetch("../../app/controllers/InscripcionController.php?accion=estado")
    .then(r => r.json())
    .then(data => {
      TIENE_SESION = !!data.tieneSesion;

      if (TIENE_SESION) {
        document.getElementById("datosUsuario").style.display = "none";
      }

      if ((data.total ?? 0) >= 2) {
        window.location.href = "index.html";
      }
    })
    .catch(() => {
      TIENE_SESION = false;
    });
});

/* =========================
   SISTEMA DE ERRORES
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

function limpiarError(campo) {
  const error = campo.parentNode.querySelector(".error-msg");
  if (error) error.remove();
  campo.classList.remove("input-error");
}

/* =========================
   VALIDACIONES
========================= */
function obligatorio(campo) {
  if (!campo.value.trim()) {
    mostrarError(campo, "Este campo es obligatorio");
    return false;
  }
  limpiarError(campo);
  return true;
}

function validarUsuario(campo) {
  if (!obligatorio(campo)) return false;
  if (campo.value.trim().length < 3) {
    mostrarError(campo, "Debe tener al menos 3 caracteres");
    return false;
  }
  limpiarError(campo);
  return true;
}

function validarContrasena(campo) {
  if (!obligatorio(campo)) return false;
  if (campo.value.length < 4 || campo.value.length > 12) {
    mostrarError(campo, "Debe tener entre 4 y 12 caracteres");
    return false;
  }
  limpiarError(campo);
  return true;
}

function validarEmail(campo) {
  if (!obligatorio(campo)) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(campo.value)) {
    mostrarError(campo, "Formato de email no válido");
    return false;
  }
  limpiarError(campo);
  return true;
}

function validarArchivo(campo) {
  if (!campo.files || campo.files.length === 0) {
    mostrarError(campo, "Debes seleccionar un archivo");
    return false;
  }
  limpiarError(campo);
  return true;
}

function validarVideo(campo) {
  if (!obligatorio(campo)) return false;
  if (!campo.value.startsWith("http")) {
    mostrarError(campo, "Debe ser un enlace válido");
    return false;
  }
  limpiarError(campo);
  return true;
}

function validarDni(campo) {
  if (!obligatorio(campo)) return false;
  const v = campo.value.trim().toUpperCase();
  const regex = /^\d{8}[A-Z]$/;
  if (!regex.test(v)) {
    mostrarError(campo, "DNI no válido (formato: 12345678Z)");
    return false;
  }
  limpiarError(campo);
  return true;
}

function validarExpediente(campo) {
  if (!obligatorio(campo)) return false;
  const v = campo.value.trim();
  if (v.length < 3) {
    mostrarError(campo, "Debe tener al menos 3 caracteres");
    return false;
  }
  limpiarError(campo);
  return true;
}

/* =========================
   VALIDAR ALUMNO / ALUMNI
========================= */
function validarTipoParticipante(campo) {
  if (!obligatorio(campo)) return false;

  const v = campo.value.trim();

  if (v !== "Alumno" && v !== "Alumni") {
    mostrarError(campo, "Debes seleccionar Alumno o Alumni");
    return false;
  }

  limpiarError(campo);
  return true;
}

/* =========================
   VALIDACIÓN BLUR
========================= */
document
  .querySelectorAll("#formInscripcion input, #formInscripcion textarea, #formInscripcion select")
  .forEach(campo => {
    campo.addEventListener("blur", () => {
      switch (campo.name) {
        case "usuario": validarUsuario(campo); break;
        case "contrasena": validarContrasena(campo); break;
        case "email": validarEmail(campo); break;
        case "dni": validarDni(campo); break;
        case "expediente": validarExpediente(campo); break;
        case "video": validarVideo(campo); break;
        case "sinopsis": obligatorio(campo); break;
        case "tipo_participante": validarTipoParticipante(campo); break;
      }
    });
  });

/* =========================
   SUBMIT
========================= */
document.getElementById("formInscripcion").addEventListener("submit", async e => {
  e.preventDefault();

  const form = e.target;
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = "";

  const ficha = form.ficha;
  const cartel = form.cartel;
  const sinopsis = form.sinopsis;
  const usuario = form.usuario;
  const contrasena = form.contrasena;
  const email = form.email;
  const dni = form.dni;
  const expediente = form.expediente;
  const video = form.video;
  const tipo = form.tipo_participante;

  const errores = [];

  const okFicha = validarArchivo(ficha); if (!okFicha) errores.push("Ficha");
  const okCartel = validarArchivo(cartel); if (!okCartel) errores.push("Cartel");
  const okSinopsis = obligatorio(sinopsis); if (!okSinopsis) errores.push("Sinopsis");
  const okVideo = validarVideo(video); if (!okVideo) errores.push("Vídeo");

  let okUsuario = true, okPass = true, okEmail = true, okDni = true, okExp = true, okTipo = true;

  if (!TIENE_SESION) {
    okUsuario = validarUsuario(usuario); if (!okUsuario) errores.push("Usuario");
    okPass = validarContrasena(contrasena); if (!okPass) errores.push("Contraseña");
    okEmail = validarEmail(email); if (!okEmail) errores.push("Email");
    okDni = validarDni(dni); if (!okDni) errores.push("DNI");
    okExp = validarExpediente(expediente); if (!okExp) errores.push("Nº Expediente");
    okTipo = validarTipoParticipante(tipo); if (!okTipo) errores.push("Tipo de participante");
  }

  const valido = okFicha && okCartel && okSinopsis && okVideo && okUsuario && okPass && okEmail && okDni && okExp && okTipo;

  if (!valido) {
    mensaje.textContent = "Revisa estos campos: " + [...new Set(errores)].join(", ") + ".";
    return;
  }

  if (!TIENE_SESION) {
    const datos = new FormData();
    datos.append("usuario", usuario.value);
    datos.append("email", email.value);
    datos.append("dni", dni.value);
    datos.append("expediente", expediente.value);

    try {
      const res = await fetch("../../app/controllers/InscripcionController.php?accion=comprobarDuplicados", {
        method: "POST",
        body: datos
      });

      const json = await res.json();

      if (!json.ok) {
        const dup = [];
        if (json.usuario) { mostrarError(usuario, "Este usuario ya está en uso"); dup.push("Usuario"); }
        if (json.email) { mostrarError(email, "Este email ya está en uso"); dup.push("Email"); }
        if (json.dni) { mostrarError(dni, "Este DNI ya está registrado"); dup.push("DNI"); }
        if (json.expediente) { mostrarError(expediente, "Este Nº de expediente ya existe"); dup.push("Nº Expediente"); }

        mensaje.textContent = dup.length ? "Duplicado en: " + dup.join(", ") + "." : "Hay datos duplicados.";
        return;
      }
    } catch (err) {
      mensaje.textContent = "Error del servidor al comprobar duplicados.";
      return;
    }
  }

  const formData = new FormData(form);

  fetch("../../app/controllers/InscripcionController.php", {
    method: "POST",
    body: formData
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) window.location.href = "perfil.html";
      else mensaje.innerText = data.error || "Error al enviar la inscripción";
    })
    .catch(() => {
      mensaje.innerText = "Error al enviar la inscripción";
    });
});
