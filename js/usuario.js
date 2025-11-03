document.addEventListener('DOMContentLoaded', () => {
    const perfilForm = document.getElementById('perfil-form');
    const validarDireccionBtn = document.getElementById('validar-direccion-btn');
    const perfilFoto = document.getElementById('perfilfoto');
    const fotoInput = document.getElementById('foto-input');


    /**
     * Carga los datos del usuario desde la API y los muestra en el formulario.
     */
    const fetchUsuario = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id'); // ID del usuario a visualizar (si existe)

        const token = localStorage.getItem('token');

        if (!token) {
            showToast('Debes iniciar sesión para ver tu perfil.', 'danger');
            window.location.href = 'login.html';
            return;
        }

        // Construir la URL: si hay un ID, lo añadimos como query param
        const apiUrl = userId ? `/api/usuario.php?id=${userId}` : '/api/usuario.php';

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudieron cargar los datos del perfil.');
            }

            const usuario = await response.json();

            // Rellenar el formulario con los datos del usuario
            document.getElementById('nombre').value = usuario.nombre || '';
            document.getElementById('apellido').value = usuario.apellido || '';
            document.getElementById('telefono').value = usuario.telefono || '';
            document.getElementById('tipo_documento').value = usuario.tipo_documento || '';
            document.getElementById('documento').value = usuario.documento || '';
            document.getElementById('city').value = usuario.city || '';
            document.getElementById('road').value = usuario.road || '';
            document.getElementById('house_number').value = usuario.house_number || '';
            document.getElementById('suburb').value = usuario.suburb || '';
            document.getElementById('departamento').value = usuario.departamento || '';
            document.getElementById('fecha_nacimiento').value = usuario.fecha_nacimiento || '';
            document.getElementById('sexo').value = usuario.sexo || '';
            document.getElementById('tipo_casa').value = usuario.tipo_casa || '';
            document.getElementById('otras_mascotas').value = usuario.otras_mascotas || '';
            document.getElementById('experiencia').value = usuario.experiencia || '';
            document.getElementById('energia').value = usuario.energia || 0;
            document.getElementById('sociabilidad').value = usuario.sociabilidad || 0;
            document.getElementById('presencia').value = usuario.presencia || 0;
            document.getElementById('estilov').value = usuario.estilov || 0;

            // Actualizar la foto de perfil
            if (usuario.foto_perfil_url && usuario.foto_perfil_url.startsWith('/img/profile/')) {
                // Añadimos un timestamp para evitar problemas de caché si se sube una foto con el mismo nombre
                perfilFoto.src = usuario.foto_perfil_url + '?t=' + new Date().getTime();
            } else {
                // Si no hay foto, usamos la imagen por defecto. La ruta es relativa a la página.
                perfilFoto.src = '../img/pdefault.jpg';
            }

            // Si estamos viendo el perfil de otro usuario (como ONG), deshabilitamos el formulario.
            if (userId) {
                Array.from(perfilForm.elements).forEach(element => {
                    element.disabled = true;
                });
                perfilFoto.style.cursor = 'default'; // Quitar el cursor de "clic"

                // Ocultar los botones de acción del usuario
                const actionButtons = document.getElementById('user-action-buttons');
                if (actionButtons) {
                    actionButtons.style.display = 'none';
                }
            }

        } catch (error) {
            console.error('Error al cargar el perfil:', error);
            showToast(error.message, 'danger');
        }
    };

    /**
     * Sube la foto de perfil seleccionada por el usuario.
     * @param {File} file - El archivo de imagen a subir.
     */
    const uploadProfilePicture = async (file) => {
        const token = localStorage.getItem('token');
        if (!file || !token) return;

        const formData = new FormData();
        formData.append('foto_perfil', file);

        try {
            const response = await fetch('/api/usuario.php', {
                method: 'POST',
                headers: {
                    // NO establecer 'Content-Type', el navegador lo hará automáticamente
                    // con el boundary correcto para multipart/form-data.
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Foto de perfil actualizada.', 'success');
                // Actualizamos la imagen en la página con la nueva URL devuelta por la API
                if (result.foto_perfil_url) {
                    perfilFoto.src = result.foto_perfil_url + '?t=' + new Date().getTime();
                }
            } else {
                throw new Error(result.message || 'No se pudo subir la imagen.');
            }
        } catch (error) {
            console.error('Error al subir la foto:', error);
            showToast(error.message, 'danger');
        }
    };

    // Event listener para el clic en la foto de perfil
    perfilFoto.addEventListener('click', () => {
        // Solo permitir cambiar la foto si no se está viendo el perfil de otro usuario
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('id')) {
            fotoInput.click();
        }
    });

    // Event listener para cuando se selecciona un archivo
    fotoInput.addEventListener('change', () => { if (fotoInput.files.length > 0) uploadProfilePicture(fotoInput.files[0]) });

    /**
     * Valida los campos del formulario de perfil.
     * @returns {boolean} - Devuelve true si el formulario es válido, false en caso contrario.
     */
    const validarFormulario = () => {
        let esValido = true;
        const campos = ['tipo_documento', 'documento', 'nombre', 'apellido' ];

        // Primero, limpiar validaciones anteriores
        campos.forEach(id => {
            const campo = document.getElementById(id);
            campo.classList.remove('is-invalid');
        });

        // Validar campos obligatorios
        campos.forEach(id => {
            const campo = document.getElementById(id);
            if (!campo.value.trim()) {
                campo.classList.add('is-invalid');
                esValido = false;
            }
        });

        // Validaciones específicas
        const documentoInput = document.getElementById('documento');
        if (documentoInput.value.trim() && !/^\d+$/.test(documentoInput.value.trim())) {
            documentoInput.classList.add('is-invalid');
            esValido = false;
        }

        if (!esValido) {
            showToast('Por favor, corrige los campos marcados en rojo.', 'warning');
        }

        return esValido;
    };

    /**
     * Valida y geocodifica la dirección ingresada por el usuario.
     */
    const handleValidarDireccion = async () => {
        const road = document.getElementById('road').value.trim();
        const house_number = document.getElementById('house_number').value.trim();
        const city = document.getElementById('city').value.trim();

        if (!road || !house_number || !city) {
            showToast('Por favor, completa la calle, número y localidad para validar.', 'warning');
            return;
        }

        const token = localStorage.getItem('token');
        const url = `/api/geocodificar.php?road=${encodeURIComponent(road)}&house_number=${encodeURIComponent(house_number)}&city=${encodeURIComponent(city)}`;

        try {
            validarDireccionBtn.disabled = true;
            validarDireccionBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Validando...';

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al validar la dirección.');
            }

            // Autocompletar campos con los datos de la API
            document.getElementById('city').value = data.city || city;
            document.getElementById('road').value = data.road || road;
            document.getElementById('house_number').value = data.house_number || house_number;
            document.getElementById('suburb').value = data.suburb || '';
            
            // Añadir lat y lon al formulario para el envío
            if (!document.getElementById('lat')) {
                perfilForm.insertAdjacentHTML('beforeend', `<input type="hidden" id="lat" name="lat" value="${data.lat}">`);
                perfilForm.insertAdjacentHTML('beforeend', `<input type="hidden" id="lon" name="lon" value="${data.lon}">`);
                perfilForm.insertAdjacentHTML('beforeend', `<input type="hidden" id="suburb" name="suburb" value="${data.suburb}">`);
            } else {
                showToast('La dirección no pudo ser validada. Revise los datos ingresados.', 'warning');
            }

            showToast('Dirección validada con éxito. Guardando...', 'success');
            perfilForm.requestSubmit(); // Envía el formulario para guardar los datos actualizados
        } catch (error) {
            showToast(error.message, 'danger');
        } finally {
            validarDireccionBtn.disabled = false;
            validarDireccionBtn.innerHTML = 'Validar Dirección';
        }
    };

    /**
     * Envía los datos del formulario para actualizar el perfil del usuario.
     */
    perfilForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        // Prevenir el envío si el formulario está deshabilitado
        if (new URLSearchParams(window.location.search).has('id')) {
            return;
        }

        // Validar el formulario antes de enviar
        if (!validarFormulario()) {
            return; // Detiene el envío si la validación falla
        }

        const formData = new FormData(perfilForm);
        const data = Object.fromEntries(formData.entries());

        // Convertir valores de los select a números
        data.energia = parseInt(data.energia, 10);
        data.sociabilidad = parseInt(data.sociabilidad, 10);
        data.presencia = parseInt(data.presencia, 10);
        data.estilov = parseInt(data.estilov, 10);

        try {
            const response = await fetch('/api/usuario.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Perfil actualizado con éxito.', 'success');
            } else {
                throw new Error(result.message || 'No se pudo actualizar el perfil.');
            }
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            showToast(error.message, 'danger');
        }
    });

    // Event listener para el botón de validar dirección
    validarDireccionBtn.addEventListener('click', handleValidarDireccion);

    // Carga inicial de los datos del usuario al entrar a la página.
    fetchUsuario();
});