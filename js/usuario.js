document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('perfil-form');
    const INCOMPLETO = 'Incompleto';

    const fetchUsuario = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = './login.html';
            return;
        }

        try {
            const response = await fetch('../api/usuario.php', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = './login.html';
                }
                throw new Error('Error al cargar los datos del usuario');
            }

            const user = await response.json();
            populateForm(user);

        } catch (error) {
            console.error(error);
            alert('No se pudieron cargar los datos del perfil.');
        }
    };

    const populateForm = (user) => {
        document.getElementById('nombre').value = user.nombre || INCOMPLETO;
        document.getElementById('apellido').value = user.apellido || INCOMPLETO;
        document.getElementById('telefono').value = user.telefono || INCOMPLETO;
        document.getElementById('direccion').value = user.direccion || INCOMPLETO;
        document.getElementById('fecha_nacimiento').value = user.fecha_nacimiento || '';
        document.getElementById('sexo').value = user.sexo || INCOMPLETO;
        document.getElementById('tipo_casa').value = user.tipo_casa || INCOMPLETO;
        document.getElementById('tipo_familia').value = user.tipo_familia || INCOMPLETO;
        document.getElementById('otras_mascotas').value = user.otras_mascotas || INCOMPLETO;
        document.getElementById('experiencia').value = user.experiencia || INCOMPLETO;

        // Dropdowns
        document.getElementById('energia').value = user.energia || 0;
        document.getElementById('sociabilidad').value = user.sociabilidad || 0;
        document.getElementById('presencia').value = user.presencia || 0;
        document.getElementById('estilov').value = user.estilov || 0;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Convert dropdowns to integers
        data.energia = parseInt(data.energia, 10);
        data.sociabilidad = parseInt(data.sociabilidad, 10);
        data.presencia = parseInt(data.presencia, 10);
        data.estilov = parseInt(data.estilov, 10);

        try {
            const response = await fetch('../api/usuario.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                window.location.reload();
            } else {
                throw new Error(result.message || 'Error al actualizar');
            }
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

    // Carga inicial de datos
    fetchUsuario();
});