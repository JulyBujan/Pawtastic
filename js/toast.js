/**
 * Muestra una notificación toast de Bootstrap de forma dinámica.
 * @param {string} message - El mensaje a mostrar en el toast.
 * @param {string} [type='info'] - El tipo de toast (e.g., 'success', 'danger', 'warning', 'info'). Determina el color de fondo.
 * @param {number} [delay=4000] - El tiempo en milisegundos que el toast permanecerá visible.
 */
function showToast(message, type = 'info', delay = 4000) {
    if (typeof bootstrap === "undefined" || !bootstrap.Toast) {
        console.warn("Bootstrap Toast no disponible.");
        return;
    }
    let toastContainer = document.querySelector('.toast-container');

    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
        document.body.appendChild(toastContainer);
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

(function setupAuthExpiryHandler() {
    if (window.__pawtasticAuthHandler) {
        return;
    }
    window.__pawtasticAuthHandler = true;
    if (typeof window.fetch !== "function") {
        return;
    }
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        if (response && response.status === 401) {
            const token = localStorage.getItem("token");
            if (token && !window.__pawtasticAuthExpired) {
                window.__pawtasticAuthExpired = true;
                try {
                    showToast("Tu sesión expiró. Volvé a iniciar sesión.", "warning");
                } catch (error) {
                    console.warn("No se pudo mostrar el toast de sesión expirada.");
                }
                localStorage.removeItem("token");
                localStorage.removeItem("tipo");
                const isInPages = window.location.pathname.includes("/pages/");
                const loginUrl = isInPages ? "login.html" : "pages/login.html";
                window.location.href = loginUrl;
            }
        }
        return response;
    };
})();
