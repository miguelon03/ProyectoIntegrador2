(() => {

    // ===============================
    //  CONFIG
    // ===============================
    const getBasePath = () => {
        const p = window.location.pathname || "";
        const idx = p.indexOf("/public/");
        if (idx !== -1) return p.substring(0, idx);
        return "/ProyectoIntegrador2";
    };

    const BASE = getBasePath();
    const API = `${BASE}/app/controllers/NoticiasController.php`;

    let indice = 0;
    let total = 0;
    let autoSlide = null;

    const escapeHtml = (t) =>
        String(t ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    const imagenAleatoria = () => {
        const imgs = ["festival.jpg", "imagen2.jpg", "imagen3.avif"];
        return imgs[Math.floor(Math.random() * imgs.length)];
    };

    const track = () => document.getElementById("newsTrack");

    // ===============================
    //  RENDER DE UNA SOLA NOTICIA
    // ===============================
    const renderSingle = (titulo, desc) => {
        const t = track();
        if (!t) return;

        t.innerHTML = `
            <article class="news-slide">
                <div class="news-text">
                    <h2>${escapeHtml(titulo)}</h2>
                    <p>${escapeHtml(desc)}</p>
                </div>
                <div class="news-image">
                    <img src="${BASE}/public/img/noticias/${imagenAleatoria()}" alt="">
                </div>
            </article>
        `;

        total = 1;
        indice = 0;
        t.style.transform = "translateX(0%)";
    };

    // ===============================
    //  MOVIMIENTO DEL CARRUSEL
    // ===============================
    const actualizar = () => {
        const t = track();
        if (!t) return;
        t.style.transform = `translateX(-${indice * 100}%)`;
    };

    const next = () => {
        if (total <= 1) return;
        indice = (indice + 1) % total;
        actualizar();
    };

    const prev = () => {
        if (total <= 1) return;
        indice = (indice - 1 + total) % total;
        actualizar();
    };

    // Exponer funciones para botones inline
    window.nextNoticia = next;
    window.prevNoticia = prev;

    // ===============================
    //  DESACTIVAR BOTONES SI NO HAY NOTICIAS
    // ===============================
    const actualizarBotones = () => {
        const prevBtn = document.querySelector("#noticiasIndex .carousel-btn.prev");
        const nextBtn = document.querySelector("#noticiasIndex .carousel-btn.next");

        if (!prevBtn || !nextBtn) return;

        if (total <= 1) {
            prevBtn.classList.add("disabled");
            nextBtn.classList.add("disabled");
        } else {
            prevBtn.classList.remove("disabled");
            nextBtn.classList.remove("disabled");
        }
    };

    // ===============================
    //  CARGA INICIAL
    // ===============================
    document.addEventListener("DOMContentLoaded", () => {

        const t = track();
        if (!t) return;

        // Placeholder inicial
        renderSingle("Cargando noticias…", "Espera un momento.");

        // Botones reales de index.php
        const prevBtn = document.querySelector("#noticiasIndex .carousel-btn.prev");
        const nextBtn = document.querySelector("#noticiasIndex .carousel-btn.next");

        if (prevBtn) prevBtn.addEventListener("click", prev);
        if (nextBtn) nextBtn.addEventListener("click", next);

        // Petición al backend
        fetch(`${API}?accion=listar`, { credentials: "same-origin" })
            .then(r => r.json())
            .then(data => {

                if (!data || data.ok !== true) {
                    renderSingle("No se pudieron cargar las noticias", data?.error || "Error desconocido.");
                    actualizarBotones();
                    return;
                }

                const noticias = Array.isArray(data.noticias) ? data.noticias : [];

                if (noticias.length === 0) {
                    renderSingle("No hay noticias", "Cuando se publiquen noticias, aparecerán aquí automáticamente.");
                    actualizarBotones();
                    return;
                }

                // Render de todas las noticias
                t.innerHTML = "";
                noticias.forEach(n => {
                    t.insertAdjacentHTML(
                        "beforeend",
                        `
                        <article class="news-slide">
                            <div class="news-text">
                                <h2>${escapeHtml(n.titulo)}</h2>
                                <p>${escapeHtml(n.descripcion)}</p>
                            </div>
                            <div class="news-image">
                                <img src="${BASE}/public/img/noticias/${imagenAleatoria()}" alt="">
                            </div>
                        </article>
                        `
                    );
                });

                total = noticias.length;
                indice = 0;
                actualizar();
                actualizarBotones();

                // Auto-slide
                if (autoSlide) clearInterval(autoSlide);
                if (total > 1) autoSlide = setInterval(next, 7000);
            })
            .catch(err => {
                console.error("Noticias error:", err);
                renderSingle("No se pudieron cargar las noticias", "Revisa consola y la ruta del proyecto.");
                actualizarBotones();
            });
    });

})();
