// UI helpers (modales globales + validación)
// Sustituye los avisos del navegador por un modal consistente en todo el proyecto.

function _uiCreateGlobalModal() {
  if (document.getElementById("uiModalGlobal")) return;

  const overlay = document.createElement("div");
  overlay.id = "uiModalGlobal";
  overlay.className = "ui-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.style.display = "none";

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

  // Cerrar al hacer click fuera
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModal();
  });

  // Cerrar con Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModal();
  });

  // Botones de cierre
  document.addEventListener("click", (e) => {
    if (!e.target) return;

    const id = e.target.id;
    if (id === "uiModalClose" || id === "uiModalOk") {
      hideModal();
    }
  });
}

// Creamos el modal lo antes posible, pero sin exigir HTML extra.
document.addEventListener("DOMContentLoaded", _uiCreateGlobalModal);

function ensureGlobalModal() {
  if (document.getElementById("uiModalGlobal")) return;
  // Si se llama antes de DOMContentLoaded, lo creamos igualmente
  if (document.body) _uiCreateGlobalModal();
}

function showModal(message, options = {}) {
  ensureGlobalModal();

  const overlay = document.getElementById("uiModalGlobal");
  const content = document.getElementById("uiModalContent");
  const title = document.getElementById("uiModalTitle");

  if (!overlay || !content || !title) {
    console.warn("Modal UI no disponible. Mensaje:", message);
    return;
  }

  title.textContent = options.title || "Aviso";
  content.textContent = message || "";

  overlay.style.display = "flex";
}

function hideModal() {
  const overlay = document.getElementById("uiModalGlobal");
  if (overlay) overlay.style.display = "none";
}

/* =========================
   Helpers de validación
========================= */
function showFieldError(inputElement, message) {
  if (!inputElement) return;
  let err = inputElement.parentElement.querySelector(".field-error");
  if (!err) {
    err = document.createElement("span");
    err.className = "field-error";
    inputElement.parentElement.appendChild(err);
  }
  err.textContent = message;
}

function clearFieldError(inputElement) {
  if (!inputElement) return;
  const err = inputElement.parentElement.querySelector(".field-error");
  if (err) err.textContent = "";
}

function clearAllFieldErrors(form) {
  if (!form) return;
  form.querySelectorAll(".field-error").forEach(e => e.textContent = "");
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#039;")
    .replaceAll('"', "&quot;");
}
