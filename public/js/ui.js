// UI helpers
function showModal(message) {
    const overlay = document.getElementById('modalGlobal');
    const content = document.getElementById('modalContent');
    if (!overlay || !content) {
        alert(message); // fallback mínimo
        return;
    }
    content.textContent = message;
    overlay.style.display = 'flex';
}
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'modalClose') {
        document.getElementById('modalGlobal').style.display = 'none';
    }
});
window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        const ov = document.getElementById('modalGlobal');
        if (ov) ov.style.display = 'none';
    }
});

function showFieldError(inputElement, message) {
    if (!inputElement) return;
    let err = inputElement.parentElement.querySelector('.field-error');
    if (!err) {
        err = document.createElement('span');
        err.className = 'field-error';
        inputElement.parentElement.appendChild(err);
    }
    err.textContent = message;
}

function clearFieldError(inputElement) {
    if (!inputElement) return;
    const err = inputElement.parentElement.querySelector('.field-error');
    if (err) err.textContent = '';
}

function clearAllFieldErrors(form) {
    if (!form) return;
    form.querySelectorAll('.field-error').forEach(e => e.textContent = '');
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("'", "&#039;")
        .replaceAll('"', "&quot;");
}
