document.addEventListener("DOMContentLoaded", () => {

    fetch("/ProyectoIntegrador2/app/controllers/SessionController.php", {
        credentials: "same-origin"
    })
    .then(r => r.json())
    .then(data => {

        const nav = document.querySelector(".nav-links");
        if (!nav) return;

        // Eliminar posibles restos
        const oldPerfil = document.getElementById("linkPerfil");
        if (oldPerfil) oldPerfil.remove();

        const loginSelect = document.getElementById("login");

        if (data.logeado) {

            // Quitar "Entrar"
            if (loginSelect) loginSelect.remove();

            // Crear "Mi perfil"
            const link = document.createElement("a");
            link.id = "linkPerfil";
            link.textContent = "Mi perfil";

            // Ruta segura según página
            const enHtml = window.location.pathname.includes("/html/");
            link.href = enHtml ? "perfil.html" : "html/perfil.html";

            nav.appendChild(link);

        } else {
            // NO logueado → asegurarse de que existe "Entrar"
            if (!loginSelect) {
                const select = document.createElement("select");
                select.id = "login";

                select.innerHTML = `
                    <option value="" selected disabled hidden>👤 Entrar</option>
                    <option value="participante">Participante</option>
                    <option value="organizador">Organizador</option>
                `;

                nav.appendChild(select);

                select.addEventListener("change", e => {
                    const tipo = e.target.value;
                    if (tipo) {
                        window.location.href =
                            enHtml ? `login.html?tipo=${tipo}`
                                   : `html/login.html?tipo=${tipo}`;
                    }
                });
            }
        }
    })
    .catch(err => console.error("Session error:", err));
});
