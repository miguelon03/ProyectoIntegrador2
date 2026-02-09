fetch("/ProyectoIntegrador2/app/controllers/SessionController.php")
  .then(r => r.json())
  .then(data => {
      if (data.logeado) {
          const nav = document.querySelector(".nav-links");
          const link = document.createElement("a");
          link.href = "perfil.html";
          link.textContent = "Mi perfil";
          nav.appendChild(link);
      }
  });
