const URL_PAT_PUBLIC =
  "/ProyectoIntegrador2/app/controllers/PatrocinadoresController.php?accion=listar";

document.addEventListener("DOMContentLoaded", () => {
  const cont = document.getElementById("footerPatrocinadores");
  if (!cont) return;

  fetch(URL_PAT_PUBLIC)
    .then(r => r.json())
    .then(data => {
      if (!data.ok || !data.patrocinadores.length) {
        cont.innerHTML = "<p class='patro-vacio'>Próximamente</p>";
        return;
      }

      cont.innerHTML = data.patrocinadores.map(p => `
        <div class="patro-footer-item">
          <img src="${p.logo}" alt="${p.nombre}" title="${p.nombre}">
        </div>
      `).join("");
    })
    .catch(() => {
      cont.innerHTML = "<p class='patro-vacio'>Error al cargar patrocinadores</p>";
    });
});
