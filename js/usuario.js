document.addEventListener('DOMContentLoaded', () => {
    const perfilForm = document.getElementById('perfil-form');
    const perfilFoto = document.getElementById('perfilfoto');
    const fotoInput = document.getElementById('foto-input');

    /**
     * Muestra una alerta simple.
     * @param {string} message - El mensaje a mostrar.
     * @param {string} type - El tipo de alerta ('success', 'danger', 'info').
     */
    const showAlert = (message, type = 'info') => {
        // Idealmente, esto sería un componente de UI más sofisticado.
        alert(message);
    };

    /**
     * Carga los datos del usuario desde la API y los muestra en el formulario.
     */
    const fetchUsuario = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id'); // ID del usuario a visualizar (si existe)

        const token = localStorage.getItem('token');

        if (!token) {
            showAlert('Debes iniciar sesión para ver tu perfil.', 'danger');
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
            document.getElementById('direccion').value = usuario.direccion || '';
            document.getElementById('fecha_nacimiento').value = usuario.fecha_nacimiento || '';
            document.getElementById('sexo').value = usuario.sexo || '';
            document.getElementById('tipo_casa').value = usuario.tipo_casa || '';
            document.getElementById('tipo_familia').value = usuario.tipo_familia || '';
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
            showAlert(error.message, 'danger');
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
                showAlert('Foto de perfil actualizada.', 'success');
                // Actualizamos la imagen en la página con la nueva URL devuelta por la API
                if (result.foto_perfil_url) {
                    perfilFoto.src = result.foto_perfil_url + '?t=' + new Date().getTime();
                }
            } else {
                throw new Error(result.message || 'No se pudo subir la imagen.');
            }
        } catch (error) {
            console.error('Error al subir la foto:', error);
            showAlert(error.message, 'danger');
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
     * Envía los datos del formulario para actualizar el perfil del usuario.
     */
    perfilForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        // Prevenir el envío si el formulario está deshabilitado
        if (new URLSearchParams(window.location.search).has('id')) {
            return;
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
                showAlert('Perfil actualizado con éxito.', 'success');
            } else {
                throw new Error(result.message || 'No se pudo actualizar el perfil.');
            }
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            showAlert(error.message, 'danger');
        }
    });

    // Carga inicial de los datos del usuario al entrar a la página.
    fetchUsuario();
});