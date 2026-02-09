document.addEventListener("DOMContentLoaded", () => {

    fetch("../../app/controllers/InscripcionController.php?accion=estado")
        .then(r => r.json())
        .then(data => {
            if (data.tieneSesion) {
                document.getElementById("datosUsuario").style.display = "none";
            }
            if (data.total >= 2) {
                window.location.href = "index.html";
            }
        });
});

/* ============================================================
   VALIDACIONES FRONT-END
============================================================ */

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

/* ============================================================
   VALIDACIÓN EN BLUR (cuando el usuario sale del campo)
============================================================ */

document.querySelectorAll("#formInscripcion input, #formInscripcion textarea").forEach(campo => {
    campo.addEventListener("blur", () => {
        switch (campo.name) {
            case "usuario": validarUsuario(campo); break;
            case "contrasena": validarContrasena(campo); break;
            case "email": validarEmail(campo); break;
            case "dni": obligatorio(campo); break;
            case "expediente": obligatorio(campo); break;
            case "video": validarVideo(campo); break;
            case "sinopsis": obligatorio(campo); break;
        }
    });
});

/* ============================================================
   VALIDACIÓN COMPLETA + DUPLICADOS + ENVÍO FINAL
============================================================ */

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

    let valido =
        validarArchivo(ficha) &
        validarArchivo(cartel) &
        obligatorio(sinopsis) &
        validarUsuario(usuario) &
        validarContrasena(contrasena) &
        validarEmail(email) &
        obligatorio(dni) &
        obligatorio(expediente) &
        validarVideo(video);

    if (!valido) {
        mensaje.textContent = "Corrige los errores antes de enviar.";
        return;
    }

    /* ============================================================
       COMPROBAR DUPLICADOS (solo si NO hay sesión)
    ============================================================ */
    const datosSesion = await fetch("../../app/controllers/InscripcionController.php?accion=estado")
        .then(r => r.json());

    if (!datosSesion.tieneSesion) {

        const datos = new FormData();
        datos.append("usuario", usuario.value);
        datos.append("email", email.value);
        datos.append("dni", dni.value);
        datos.append("expediente", expediente.value);

        const res = await fetch("../../app/controllers/InscripcionController.php?accion=comprobarDuplicados", {
            method: "POST",
            body: datos
        });

        const json = await res.json();

        if (!json.ok) {
            if (json.usuario) mostrarError(usuario, "Este usuario ya está en uso");
            if (json.email) mostrarError(email, "Este email ya está en uso");
            if (json.dni) mostrarError(dni, "Este DNI ya está registrado");
            if (json.expediente) mostrarError(expediente, "Este Nº de expediente ya existe");

            mensaje.textContent = "Corrige los errores antes de continuar.";
            return;
        }
    }

    /* ============================================================
       SI TODO ESTÁ OK → ENVIAR FORMULARIO REAL (tu lógica original)
    ============================================================ */

    const formData = new FormData(form);

    fetch("../../app/controllers/InscripcionController.php", {
        method: "POST",
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) {
            window.location.href = "perfil.html";
        } else {
            mensaje.innerText = data.error;
        }
    })
    .catch(() => {
        mensaje.innerText = "Error al enviar la inscripción";
    });
});
