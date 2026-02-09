const BASE_URL = "/ProyectoIntegrador2/app/controllers/NoticiasController.php";
let indiceActual = 0;
let total = 0;

document.addEventListener("DOMContentLoaded", () => {
    fetch(`${BASE_URL}?accion=listar`)
        .then(r => r.json())
        .then(data => {
            if (!data.ok || !data.noticias.length) return;

            const track = document.getElementById("newsTrack");
            track.innerHTML = "";

            data.noticias.forEach(n => {
                track.innerHTML += `
                    <article class="news-slide">
                        <div class="news-text">
                            <h2>${n.titulo}</h2>
                            <p>${n.descripcion}</p>
                        </div>

                        <div class="news-image">
                            <img src="/ProyectoIntegrador2/public/img/noticias/${imagenAleatoria()}" alt="">
                        </div>
                    </article>
                `;
            });

            total = data.noticias.length;
            actualizarCarrusel();
        });
});
    // Activar botones
    document.getElementById("nextBtn").addEventListener("click", nextNoticia);
    document.getElementById("prevBtn").addEventListener("click", prevNoticia);

    // Auto‑carrusel cada 6s
    setInterval(nextNoticia, 6000);
/* =========================
   CARRUSEL
========================= */
function actualizarCarrusel() {
    const track = document.getElementById("newsTrack");
    track.style.transform = `translateX(-${indiceActual * 100}%)`;
}

function nextNoticia() {
    if (!total) return;
    indiceActual = (indiceActual + 1) % total;
    actualizarCarrusel();
}

function prevNoticia() {
    if (!total) return;
    indiceActual = (indiceActual - 1 + total) % total;
    actualizarCarrusel();
}

/* =========================
   IMÁGENES ALEATORIAS
========================= */
function imagenAleatoria() {
    const imagenes = [
        "festival.jpg",
        "imagen2.jpg",
        "imagen3.avif"
    ];
    return imagenes[Math.floor(Math.random() * imagenes.length)];
}
