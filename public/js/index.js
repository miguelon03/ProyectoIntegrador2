document.addEventListener("DOMContentLoaded", () => {
    const loginSelect = document.getElementById("login");

    if (loginSelect) {
        loginSelect.addEventListener("change", e => {
            const tipo = e.target.value;
            if (tipo) {
                window.location.href = `html/login.html?tipo=${tipo}`;
            }
        });
    }
});
