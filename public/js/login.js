const params = new URLSearchParams(window.location.search);
const tipo = params.get("tipo");

// Seguridad básica
if (!["participante", "organizador"].includes(tipo)) {
    window.location.href = "/public/index.php";
}

// Pintar título y tipo
document.getElementById("tipo").value = tipo;
document.getElementById("tituloLogin").innerText =
    "Login " + tipo.charAt(0).toUpperCase() + tipo.slice(1);

// Submit
document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let valido = true;

    document.querySelectorAll(".campo").forEach(campo => {
        const input = campo.querySelector("input");
        const error = campo.querySelector(".error");

        if (!input.value.trim()) {
            error.textContent = "Campo obligatorio";
            valido = false;
        } else {
            error.textContent = "";
        }
    });

    if (!valido) return;

    const formData = new FormData(this);

    fetch("/ProyectoIntegrador2/app/controllers/AuthController.php", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                window.location.href = data.redirect;
            } else {
                document.getElementById("mensaje").innerText = data.error;
            }
        })
        .catch(() => {
            document.getElementById("mensaje").innerText = "Error de conexión";
        });

});
