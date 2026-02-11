// Noticias público (carrusel)
// Soporta 2 maquetaciones:
//  1) public/html/index.html  -> botones con id prevBtn/nextBtn y contenedor .news-carousel
//  2) public/index.php        -> botones .carousel-btn con onclick prevNoticia/nextNoticia y contenedor #noticiasIndex
(() => {
  const getBasePath = () => {
    const p = window.location.pathname || "";
    const idx = p.indexOf("/public/");
    if (idx !== -1) return p.substring(0, idx);
    return "/ProyectoIntegrador2"; // fallback
  };

  const BASE = getBasePath();
  const API = `${BASE}/app/controllers/NoticiasController.php`;

  let indiceActual = 0;
  let total = 0;
  let timer = null;

  const escapeHtml = (text) =>
    String(text ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const imagenAleatoria = () => {
    const imagenes = ["festival.jpg", "imagen2.jpg", "imagen3.avif"];
    return imagenes[Math.floor(Math.random() * imagenes.length)];
  };

  const trackEl = () => document.getElementById("newsTrack");

  const setSingleSlide = (title, desc) => {
    const track = trackEl();
    if (!track) return;
    track.innerHTML = `
      <article class="news-slide">
        <div class="news-text">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(desc)}</p>
        </div>
        <div class="news-image">
          <img src="${BASE}/public/img/noticias/${imagenAleatoria()}" alt="">
        </div>
      </article>
    `;
    total = 1;
    indiceActual = 0;
    track.style.transform = "translateX(0%)";
  };

  const actualizar = () => {
    const track = trackEl();
    if (!track) return;
    track.style.transform = `translateX(-${indiceActual * 100}%)`;
  };

  const next = () => {
    if (total <= 1) return;
    indiceActual = (indiceActual + 1) % total;
    actualizar();
  };

  const prev = () => {
    if (total <= 1) return;
    indiceActual = (indiceActual - 1 + total) % total;
    actualizar();
  };

  // Compatibilidad con public/index.php (botones inline onclick)
  // eslint-disable-next-line no-undef
  window.nextNoticia = next;
  // eslint-disable-next-line no-undef
  window.prevNoticia = prev;

  document.addEventListener("DOMContentLoaded", () => {
    const track = trackEl();
    // 1) Maquetación nueva: ids
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");
    // 2) Maquetación antigua: clases
    const nextBtnLegacy = document.querySelector("#noticiasIndex .carousel-btn.next");
    const prevBtnLegacy = document.querySelector("#noticiasIndex .carousel-btn.prev");

    if (!track) return;

    // Placeholder inmediato
    setSingleSlide("Cargando noticias…", "Espera un momento.");

    // Si existen botones (cualquier maquetación), los cableamos
    if (nextBtn) nextBtn.addEventListener("click", next);
    if (prevBtn) prevBtn.addEventListener("click", prev);
    if (nextBtnLegacy) nextBtnLegacy.addEventListener("click", next);
    if (prevBtnLegacy) prevBtnLegacy.addEventListener("click", prev);

    fetch(`${API}?accion=listar`, { credentials: "same-origin" })
      .then(async (r) => {
        const txt = await r.text();
        try {
          return JSON.parse(txt);
        } catch (e) {
          console.error("Noticias: respuesta no es JSON", txt);
          throw e;
        }
      })
      .then((data) => {
        if (!data || data.ok !== true) {
          console.error("Noticias: API ok=false", data);
          setSingleSlide("No se pudieron cargar las noticias", data?.error || "Error desconocido.");
          return;
        }

        const noticias = Array.isArray(data.noticias) ? data.noticias : [];

        if (noticias.length === 0) {
          setSingleSlide("No hay noticias", "Cuando se publiquen noticias, aparecerán aquí automáticamente.");
          return;
        }

        track.innerHTML = "";
        noticias.forEach((n) => {
          track.insertAdjacentHTML(
            "beforeend",
            `<article class="news-slide">
              <div class="news-text">
                <h2>${escapeHtml(n.titulo ?? "")}</h2>
                <p>${escapeHtml(n.descripcion ?? "")}</p>
              </div>
              <div class="news-image">
                <img src="${BASE}/public/img/noticias/${imagenAleatoria()}" alt="">
              </div>
            </article>`
          );
        });

        total = noticias.length;
        indiceActual = 0;
        actualizar();

        if (timer) clearInterval(timer);
        if (total > 1) timer = setInterval(next, 7000);
      })
      .catch((err) => {
        console.error("Noticias error:", err);
        setSingleSlide("No se pudieron cargar las noticias", "Revisa consola y la ruta del proyecto.");
      });
  });
})();
