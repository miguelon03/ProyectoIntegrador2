document.addEventListener("DOMContentLoaded", () => {

  fetch("../../app/controllers/EventoController.php?accion=listar")
    .then(r => r.json())
    .then(data => {

      const eventos = data.eventos.map(e => ({
        title: e.titulo,
        start: `${e.fecha}T${e.hora}`,
        descripcion: e.descripcion
      }));

      const calendar = new FullCalendar.Calendar(
        document.getElementById("calendar"), {
          initialView: 'dayGridMonth',
          locale: 'es',
          dayMaxEvents: true,
          events: eventos,

          dateClick: info => {
            const delDia = eventos.filter(ev =>
              ev.start.startsWith(info.dateStr)
            );

            if (!delDia.length) return;

            document.getElementById("popupTitulo").innerText =
              "Eventos del " + info.dateStr;

            document.getElementById("popupEventos").innerHTML =
              delDia.map(e =>
                `<p><strong>${e.title}</strong><br>${e.descripcion}</p>`
              ).join("");

            document.getElementById("popup").classList.remove("hidden");
          }
        });

      calendar.render();
    });
});

function cerrarPopup() {
  document.getElementById("popup").classList.add("hidden");
}
