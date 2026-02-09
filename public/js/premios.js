const URL_PREMIOS = "../../app/controllers/PremiosController.php";

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formPremio");
    if (!form) return; // 🔑 evita el error addEventListener null

    window.cargarPremios = function () {
        fetch(`${URL_PREMIOS}?accion=listar`)
            .then(r => r.json())
            .then(data => {
                const lista = document.getElementById("listaPremios");
                const select = document.getElementById("categoriaSelect");

                if (!lista || !select) return;

                lista.innerHTML = "";
                select.innerHTML = "";

                data.premios.forEach(p => {
                    lista.innerHTML += `<p>${p.nombre}</p>`;
                    select.innerHTML += `<option value="${p.id_premio}">${p.nombre}</option>`;
                });
            });
    };

    form.addEventListener("submit", e => {
        e.preventDefault();

        const nombre = form.nombre.value.trim();
        if (!nombre) return;

        fetch(`${URL_PREMIOS}?accion=crear`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `nombre=${encodeURIComponent(nombre)}`
        })
        .then(() => {
            form.reset();
            cargarPremios();
        });
    });
});
