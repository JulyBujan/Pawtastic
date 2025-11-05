document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-registro-ong');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Validar el formulario
        if (!validarFormulario()) {
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...`;

        // 2. Crear FormData para enviar datos y archivos
        const formData = new FormData();

        // Datos de la organización
        formData.append('nombre', document.getElementById('ong-nombre').value);
        formData.append('razon_social', document.getElementById('ong-razon-social').value);
        formData.append('cuit', document.getElementById('ong-cuit').value);
        formData.append('fecha_constitucion', document.getElementById('ong-fecha-constitucion').value);

        // Domicilio
        formData.append('calle', document.getElementById('ong-calle').value);
        formData.append('numero', document.getElementById('ong-numero').value);
        formData.append('localidad', document.getElementById('ong-localidad').value);
        formData.append('barrio', document.getElementById('ong-barrio').value);

        // Archivos
        formData.append('estatuto', document.getElementById('ong-estatuto').files[0]);
        formData.append('constancia_cuit', document.getElementById('ong-constancia-cuit').files[0]);
        formData.append('acta_autoridades', document.getElementById('ong-acta-autoridades').files[0]);

        try {
            // 3. Enviar a la API
            const response = await fetch('../api/registro-ong.php', {
                method: 'POST',
                body: formData
                // No se establece 'Content-Type', el navegador lo hace automáticamente para FormData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Ocurrió un error al enviar la solicitud.');
            }

            showToast(result.message, 'success');
            form.reset();
            setTimeout(() => {
                window.location.href = '../index.html'; // Redirigir al inicio tras el éxito
            }, 3000);

        } catch (error) {
            showToast(error.message, 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });

    /**
     * Valida que todos los campos requeridos del formulario estén completos.
     * @returns {boolean} - True si el formulario es válido, false en caso contrario.
     */
    function validarFormulario() {
        let esValido = true;
        const camposRequeridos = [
            'ong-nombre', 'ong-razon-social', 'ong-cuit', 'ong-fecha-constitucion',
            'ong-calle', 'ong-numero', 'ong-localidad'
        ];
        const archivosRequeridos = ['ong-estatuto', 'ong-constancia-cuit', 'ong-acta-autoridades'];

        // Validar campos de texto
        camposRequeridos.forEach(id => {
            const campo = document.getElementById(id);
            if (!campo.value.trim()) {
                campo.classList.add('is-invalid');
                esValido = false;
            } else {
                campo.classList.remove('is-invalid');
            }
        });

        // Validar campos de archivo
        archivosRequeridos.forEach(id => {
            const campo = document.getElementById(id);
            if (campo.files.length === 0) {
                campo.classList.add('is-invalid');
                esValido = false;
            } else {
                campo.classList.remove('is-invalid');
            }
        });

        if (!esValido) {
            showToast('Por favor, completa todos los campos requeridos.', 'warning');
        }

        return esValido;
    }
});