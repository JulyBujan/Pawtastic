document.addEventListener('DOMContentLoaded', () => {
    const perfilForm = document.getElementById('perfil-form');
    const validarDireccionBtn = document.getElementById('validar-direccion-btn');
    const perfilFoto = document.getElementById('perfilfoto');
    const fotoInput = document.getElementById('foto-input');
    const stepButtons = Array.from(document.querySelectorAll('.profile-step-btn'));
    const steps = Array.from(document.querySelectorAll('.profile-step'));
    const prevStepBtn = document.getElementById('profilePrev');
    const nextStepBtn = document.getElementById('profileNext');
    const stepInfo = document.getElementById('profilePageInfo');
    const progressBar = document.getElementById('profileProgressBar');
    const progressText = document.getElementById('profileProgressText');
    const actionButtons = document.getElementById('user-action-buttons');
    const urlParams = new URLSearchParams(window.location.search);
    const isReadonly = urlParams.has('id');
    const defaultPhoto = perfilFoto?.dataset.defaultSrc || '../img/fotoJW.jpg?v=2';
    let currentStep = 0;

    steps.forEach((step, index) => {
        if (!step.dataset.step) {
            step.dataset.step = `${index}`;
        }
    });

    stepButtons.forEach((button, index) => {
        if (!button.dataset.step) {
            button.dataset.step = `${index}`;
        }
    });

    const setStep = (nextStep) => {
        if (!steps.length) return;
        const totalSteps = steps.length;
        const clampedStep = Math.max(0, Math.min(totalSteps - 1, nextStep));
        currentStep = clampedStep;

        steps.forEach(step => {
            step.classList.toggle('is-active', parseInt(step.dataset.step, 10) === currentStep);
        });

        stepButtons.forEach(btn => {
            const isActive = parseInt(btn.dataset.step, 10) === currentStep;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (stepInfo) {
            stepInfo.textContent = `Paso ${currentStep + 1} de ${totalSteps}`;
        }

        if (prevStepBtn) prevStepBtn.disabled = currentStep === 0;
        if (nextStepBtn) nextStepBtn.disabled = currentStep === totalSteps - 1;

        if (actionButtons) {
            if (isReadonly) {
                actionButtons.style.display = 'none';
            } else {
                actionButtons.style.display = currentStep === totalSteps - 1 ? 'flex' : 'none';
            }
        }
    };

    const isFieldFilled = (id, options = {}) => {
        const field = document.getElementById(id);
        if (!field) return true;
        const value = `${field.value ?? ''}`.trim();
        if (options.disallowZero) {
            return value !== '' && value !== '0';
        }
        return value !== '';
    };

    const updateProgress = () => {
        const sections = [
            {
                key: 'personal',
                fields: [
                    { id: 'nombre' },
                    { id: 'apellido' },
                    { id: 'telefono' },
                    { id: 'tipo_documento' },
                    { id: 'documento' }
                ]
            },
            {
                key: 'direccion',
                fields: [
                    { id: 'city' },
                    { id: 'road' },
                    { id: 'house_number' }
                ]
            },
            {
                key: 'hogar',
                fields: [
                    { id: 'fecha_nacimiento' },
                    { id: 'sexo' },
                    { id: 'tipo_casa' },
                    { id: 'otras_mascotas' }
                ]
            },
            {
                key: 'personalidad',
                fields: [
                    { id: 'energia', options: { disallowZero: true } },
                    { id: 'sociabilidad', options: { disallowZero: true } },
                    { id: 'presencia', options: { disallowZero: true } },
                    { id: 'estilov', options: { disallowZero: true } }
                ]
            }
        ];

        let completed = 0;

        sections.forEach(section => {
            const isComplete = section.fields.every(field =>
                isFieldFilled(field.id, field.options || {})
            );
            if (isComplete) {
                completed += 1;
            }

            const item = document.querySelector(`.profile-check-item[data-section="${section.key}"]`);
            if (item) {
                item.classList.toggle('is-complete', isComplete);
                const status = item.querySelector('.profile-check-status');
                if (status) {
                    status.textContent = isComplete ? 'Completo' : 'Pendiente';
                }
            }
        });

        const total = sections.length || 1;
        const percent = Math.round((completed / total) * 100);

        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.setAttribute('aria-valuenow', `${percent}`);
        }

        if (progressText) {
            progressText.textContent = `${percent}% completo`;
        }
    };

    /**
     * Carga los datos del usuario desde la API y los muestra en el formulario.
     */
    const fetchUsuario = async () => {
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
            document.getElementById('tipo_documento').value = usuario.tipo_documento ?? '';
            document.getElementById('documento').value = usuario.documento || '';
            document.getElementById('city').value = usuario.city || '';
            document.getElementById('road').value = usuario.road || '';
            document.getElementById('house_number').value = usuario.house_number || '';
            document.getElementById('departamento').value = usuario.departamento || '';
            document.getElementById('fecha_nacimiento').value = usuario.fecha_nacimiento || '';
            document.getElementById('sexo').value = usuario.sexo || '';
            document.getElementById('tipo_casa').value = usuario.tipo_casa || '';
            document.getElementById('otras_mascotas').value = usuario.otras_mascotas ?? 0;
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
                perfilFoto.src = defaultPhoto;
            }

            // Si estamos viendo el perfil de otro usuario (como ONG), deshabilitamos el formulario.
            if (userId) {
                const formFields = perfilForm.querySelectorAll('input, select, textarea');
                formFields.forEach(field => {
                    field.disabled = true;
                });
                if (validarDireccionBtn) {
                    validarDireccionBtn.disabled = true;
                }
                perfilFoto.style.cursor = 'default'; // Quitar el cursor de "clic"

                if (actionButtons) {
                    actionButtons.style.display = 'none';
                }
            }

            updateProgress();

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

            const rawText = await response.text();
            let data = {};
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch (parseError) {
                throw new Error('La respuesta del servidor no es válida.');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Error al validar la dirección.');
            }

            // Autocompletar campos con los datos de la API
            document.getElementById('city').value = data.city || city;
            document.getElementById('road').value = data.road || road;
            document.getElementById('house_number').value = data.house_number || house_number;
            
            // Añadir o actualizar los campos ocultos de geolocalización
            if (!document.getElementById('lat')) {
                // Si no existen, los creamos
                perfilForm.insertAdjacentHTML('beforeend', `<input type="hidden" id="lat" name="lat" value="${data.lat}">`);
                perfilForm.insertAdjacentHTML('beforeend', `<input type="hidden" id="lon" name="lon" value="${data.lon}">`);
                perfilForm.insertAdjacentHTML('beforeend', `<input type="hidden" id="suburb" name="suburb" value="${data.suburb}">`);
            } else {
                // Si ya existen, actualizamos sus valores
                document.getElementById('lat').value = data.lat;
                document.getElementById('lon').value = data.lon;
                document.getElementById('suburb').value = data.suburb;
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
        data.otras_mascotas = parseInt(data.otras_mascotas, 10);
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
                if (typeof setStep === 'function') {
                    setStep(0);
                }
                if (stepButtons && stepButtons[0]) {
                    stepButtons[0].classList.add('is-highlight');
                    setTimeout(() => {
                        stepButtons[0].classList.remove('is-highlight');
                    }, 1400);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
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

    stepButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const targetStep = parseInt(button.dataset.step, 10);
            if (!Number.isNaN(targetStep)) {
                setStep(targetStep);
            }
        });
    });

    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', (event) => {
            event.preventDefault();
            setStep(currentStep - 1);
        });
    }

    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', (event) => {
            event.preventDefault();
            setStep(currentStep + 1);
        });
    }

    if (perfilForm) {
        perfilForm.addEventListener('input', updateProgress);
        perfilForm.addEventListener('change', updateProgress);
    }

    // Carga inicial de los datos del usuario al entrar a la página.
    fetchUsuario();
    setStep(currentStep);
    updateProgress();
});
