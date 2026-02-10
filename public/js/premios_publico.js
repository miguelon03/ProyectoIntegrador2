fetch("/ProyectoIntegrador2/app/controllers/PremioController.php?accion=publico")
  .then(r => r.json())
  .then(data => {
    if (!data.ok) return;

    // ===== UE =====
    const ue = data.ganadores?.UE || {};
    setText("ueGanador1", ue.PRIMERO || "Pendiente");
    setText("ueGanador2", ue.SEGUNDO || "Pendiente");
    setText("ueGanador3", ue.TERCERO || "Pendiente");

    // ===== ALUMNI =====
    const al = data.ganadores?.ALUMNI || {};
    setText("alGanador1", al.PRIMERO || "Pendiente");
    setText("alGanador2", al.SEGUNDO || "Pendiente");

    // ===== HONORÍFICO =====
    const hon = document.getElementById("honorificoPublico");
    if (hon) {
      if (!data.honorifico) {
        hon.textContent = "Pendiente de anunciar";
      } else {
        hon.innerHTML = `
          <strong>${escapeHtml(data.honorifico.nombre)}</strong><br>
          ${escapeHtml(data.honorifico.descripcion)}<br>
          ${data.honorifico.enlace ? `<a href="${data.honorifico.enlace}" target="_blank">Más información</a>` : ""}
        `;
      }
    }
  });

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
  if (value && value !== "Pendiente") el.classList.remove("pendiente");
}
