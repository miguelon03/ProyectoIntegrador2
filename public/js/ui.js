// UI helpers + Hamburguesa global para headers públicos
// - No requiere cambiar HTML: inserta botón si existe .main-nav y .nav-links

function _uiCreateGlobalModal() {
  if (document.getElementById("uiModalGlobal")) return;

  const overlay = document.createElement("div");
  overlay.id = "uiModalGlobal";
  overlay.className = "ui-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="ui-modal" role="document">
      <div class="ui-modal-header">
        <h3 class="ui-modal-title" id="uiModalTitle">Aviso</h3>
        <button type="button" class="ui-modal-close" id="uiModalClose" aria-label="Cerrar">✖</button>
      </div>
      <div class="ui-modal-body" id="uiModalContent"></div>
      <div class="ui-modal-actions">
        <button type="button" class="ui-btn ui-btn-primary" id="uiModalOk">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModal();
  });

  document.addEventListener("click", (e) => {
    const id = e.target && e.target.id;
    if (id === "uiModalClose" || id === "uiModalOk") hideModal();
  });
}

function ensureGlobalModal() {
  if (document.getElementById("uiModalGlobal")) return;
  if (document.body) _uiCreateGlobalModal();
}

function showModal(message, options = {}) {
  ensureGlobalModal();
  const overlay = document.getElementById("uiModalGlobal");
  const content = document.getElementById("uiModalContent");
  const title = document.getElementById("uiModalTitle");
  if (!overlay || !content || !title) return;

  title.textContent = options.title || "Aviso";
  content.textContent = message || "";
  overlay.style.display = "flex";
}

function hideModal() {
  const overlay = document.getElementById("uiModalGlobal");
  if (overlay) overlay.style.display = "none";
}

/* =========================
   Hamburguesa header público
========================= */
function setupHamburgerNav() {
  const mainNav = document.querySelector(".main-nav");
  const nav = document.querySelector(".nav-links");
  if (!mainNav || !nav) return;

  // Evitar duplicados
  if (document.getElementById("navToggleBtn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "navToggleBtn";
  btn.className = "nav-toggle";
  btn.setAttribute("aria-label", "Abrir menú");
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="square"/>
    </svg>
  `;

  mainNav.appendChild(btn);

  const closeOnResize = () => {
    // Al pasar a desktop, aseguramos menú visible (CSS manda)
    if (window.innerWidth > 768) nav.classList.remove("is-open");
  };

  btn.addEventListener("click", () => {
    nav.classList.toggle("is-open");
  });

  window.addEventListener("resize", closeOnResize);
}

document.addEventListener("DOMContentLoaded", () => {
  _uiCreateGlobalModal();
  setupHamburgerNav();
});
