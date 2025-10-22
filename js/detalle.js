document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mascotaId = urlParams.get('id');

    if (!mascotaId) {
        window.location.href = './catalogo.html';
        return;
    }

    const fetchMascotaDetalle = async () => {
        try {
            const response = await fetch(`../api/get_mascota.php?id=${mascotaId}`);
            if (!response.ok) {
                throw new Error('Error al cargar la mascota');
            }
            const mascota = await response.json();
            renderMascotaDetalle(mascota);
        } catch (error) {
            console.error(error);
            document.querySelector('main.container').innerHTML = '<p class="text-center">No se pudo cargar la información de la mascota. Intente más tarde.</p>';
        }
    };

    const renderMascotaDetalle = (mascota) => {
        document.getElementById('mascota-nombre').textContent = mascota.nombre;
        document.getElementById('mascota-descripcion').textContent = mascota.descripcion;
        document.getElementById('mascota-imagen').src = `../img/mascotas/${mascota.imagen || 'default.jpg'}`;
        document.getElementById('mascota-imagen').alt = mascota.nombre;
        document.getElementById('mascota-edad').textContent = mascota.edad;
        document.getElementById('mascota-especie').textContent = mascota.tipo;
        document.getElementById('mascota-tamano').textContent = mascota.tamaño;
        document.getElementById('mascota-vacunas').textContent = mascota.vacunado;
        document.getElementById('mascota-estado').textContent = 'En adopción'; // Assuming all are for adoption
        document.getElementById('mascota-ong').textContent = 'ONG Desconocida'; // This would require a join in the backend
    };

    fetchMascotaDetalle();
});