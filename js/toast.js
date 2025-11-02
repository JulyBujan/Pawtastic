/**
 * Muestra una notificación toast de Bootstrap de forma dinámica.
 * @param {string} message - El mensaje a mostrar en el toast.
 * @param {string} [type='info'] - El tipo de toast (e.g., 'success', 'danger', 'warning', 'info'). Determina el color de fondo.
 * @param {number} [delay=4000] - El tiempo en milisegundos que el toast permanecerá visible.
 */
function showToast(message, type = 'info', delay = 4000) {
    const toastContainer = document.querySelector('.toast-container');

    // Si no se encuentra el contenedor de toasts, se usa un alert como fallback.
    if (!toastContainer) {
        console.warn('Contenedor de toasts no encontrado. Usando alert() como fallback.');
        alert(message);
        return;
    }

    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${delay}" style="overflow: hidden;">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-progress" style="animation: toast-progress-animation ${delay}ms linear forwards;"></div>
        </div>`;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl);
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove()); // Limpiar del DOM
    toast.show();
}