document.addEventListener("DOMContentLoaded", () => {

    const pathname = window.location.pathname || "";
    const enHtml = pathname.includes("/html/");

    const nav = document.querySelector(".nav-links");
    if (!nav) return;

    // Intentamos deducir BASE_PATH de forma robusta (funciona en /ProyectoIntegrador2/... y también si está en raíz)
    const candidates = [];
    const idx = pathname.indexOf("/public/");
    if (idx !== -1) candidates.push(pathname.substring(0, idx)); // puede ser "" si la URL empieza por /public/...
    candidates.push("/ProyectoIntegrador2");
    candidates.push("");

    const BASES = [...new Set(candidates)];

    // Referencias UI (pueden existir o no según página)
    const getBtnInscripcionMenu = () =>
        document.getElementById("btnInscripcion") ||
        nav.querySelector("a[href*='inscripcion']");

    const getBtnHeroInscripcion = () =>
        document.querySelector(".btn-principal[href*='inscripcion']");

    const getLogoutLink = () =>
        nav.querySelector("a.logout") ||
        nav.querySelector("a[href*='logout.php']");

    const getLoginSelect = () => document.getElementById("login");

    const removeOldLink = () => {
        const old = document.getElementById("linkPerfil");
        if (old) old.remove();
    };

    function aplicarUIConSesion(data, BASE_PATH) {
        removeOldLink();

        const btnInscripcionMenu = getBtnInscripcionMenu();
        const btnHeroInscripcion = getBtnHeroInscripcion();
        let logoutLink = getLogoutLink();
        const loginSelect = getLoginSelect();

        if (data && data.logeado) {

            // Ocultar botones de inscripción si está logueado (participante u organizador)
            if (btnInscripcionMenu) btnInscripcionMenu.style.display = "none";
            if (btnHeroInscripcion) btnHeroInscripcion.style.display = "none";

            // Quitar "Entrar"
            if (loginSelect) loginSelect.remove();

            // Link principal según rol
            const tipo = (data.tipo || "").toLowerCase();

            const link = document.createElement("a");
            link.id = "linkPerfil";
            link.classList.add("nav-item");

            if (tipo === "organizador") {
                link.textContent = "Panel";
                link.href = enHtml ? "panel_organizador.html" : "html/panel_organizador.html";
            } else {
                link.textContent = "Mi perfil";
                link.href = enHtml ? "perfil.html" : "html/perfil.html";
            }

            // Asegurar "Cerrar sesión"
            if (!logoutLink) {
                logoutLink = document.createElement("a");
                logoutLink.textContent = "Cerrar sesión";
                logoutLink.classList.add("nav-item", "logout");
                logoutLink.href = `${BASE_PATH}/logout.php`;
            } else {
                logoutLink.classList.add("nav-item", "logout");
                // Si no tiene href, lo ponemos
                if (!logoutLink.getAttribute("href")) {
                    logoutLink.href = `${BASE_PATH}/logout.php`;
                }
            }

            // ORDEN: primero (Mi perfil/Panel) y luego Cerrar sesión
            if (logoutLink.parentElement) logoutLink.remove();

            nav.appendChild(link);
            nav.appendChild(logoutLink);

        } else {

            // NO logueado → mostrar Inscripción
            if (btnInscripcionMenu) btnInscripcionMenu.style.display = "";
            if (btnHeroInscripcion) btnHeroInscripcion.style.display = "";

            // Quitar logout si existiera
            if (logoutLink) logoutLink.remove();

            // Asegurar "Entrar"
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
    }

    function intentarFetchSesion(i) {
        if (i >= BASES.length) {
            console.error("No se pudo obtener la sesión (SessionController no accesible).");
            // Dejamos la UI tal cual (como no logueado).
            return;
        }

        const BASE_PATH = BASES[i];
        const SESSION_URL = `${BASE_PATH}/app/controllers/SessionController.php`;

        fetch(SESSION_URL, { credentials: "same-origin" })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => aplicarUIConSesion(data, BASE_PATH))
            .catch(() => intentarFetchSesion(i + 1));
    }

    intentarFetchSesion(0);
});
