// Footer patrocinadores (público)
// FIX:
// - Soporta IDs: #footerPatrocinadores (index) y #patrocinadoresGrid (otros)
// - Rutas robustas (no hardcodea /ProyectoIntegrador2)
// - Renderiza máx 2 logos y rota aleatoriamente

(() => {
  const getBasePath = () => {
    const p = window.location.pathname || "";
    const idx = p.indexOf("/public/");
    if (idx !== -1) return p.substring(0, idx);
    return "/ProyectoIntegrador2"; // fallback
  };

  const BASE = getBasePath();
  const API = `${BASE}/app/controllers/PatrocinadoresController.php`;

  const container =
    document.getElementById("footerPatrocinadores") ||
    document.getElementById("patrocinadoresGrid");

  if (!container) return;

  const normalizarSrc = (raw) => {
    if (!raw) return "";
    const s = String(raw);

    if (/^https?:\/\//i.test(s)) return s;

    // Si viene con /uploads/
    if (s.includes("/uploads/")) {
      const file = s.split("/uploads/").pop();
      return `${BASE}/uploads/${file}`;
    }

    // Si viene con /public/...
    if (s.includes("/public/")) {
      return `${BASE}/${s.replace(/^\/+/, "")}`;
    }

    // Nombre simple -> uploads
    if (!s.includes("/")) return `${BASE}/uploads/${s}`;

    return `${BASE}/${s.replace(/^\/+/, "")}`;
  };

  let logos = [];
  let timer = null;

  const render = (items) => {
    container.innerHTML = "";
    items.forEach(it => {
      const img = document.createElement("img");
      img.alt = it.nombre || "Patrocinador";
      img.src = normalizarSrc(it.logo);
      img.loading = "lazy";
      container.appendChild(img);
    });
  };

  const tick = () => {
    if (logos.length <= 2) { render(logos); return; }
    const shuffled = [...logos].sort(() => Math.random() - 0.5);
    render(shuffled.slice(0, 2));
  };

  fetch(`${API}?accion=listar`, { credentials: "same-origin" })
    .then(r => r.json())
    .then(data => {
      if (!data?.ok || !Array.isArray(data.patrocinadores)) return;
      logos = data.patrocinadores;

      tick();
      if (timer) clearInterval(timer);
      if (logos.length > 2) timer = setInterval(tick, 6000);
    })
    .catch(err => console.error("Patrocinadores error:", err));
})();
