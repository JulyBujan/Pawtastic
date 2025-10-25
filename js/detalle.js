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
            console.log(response);
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
        document.getElementById('mascota-esterilizado').textContent = mascota.esterilizado;
        document.getElementById('mascota-chip').textContent = mascota.chip;
        document.getElementById('mascota-energia').textContent = getEnergia(parseInt(mascota.energia));
        document.getElementById('mascota-sociabilidad').textContent = getSociabilidad(parseInt(mascota.sociabilidad));
        document.getElementById('mascota-presencia').textContent = getPresencia(parseInt(mascota.presencia));
        document.getElementById('mascota-estilo-vida').textContent = getEstiloVida(parseInt(mascota.estilo_vida));
        document.getElementById('mascota-estado').textContent = mascota.estado == 0 ? 'En adopción' : 'En gestión';
        document.getElementById('mascota-ong').textContent = mascota.ong_nombre || 'ONG Desconocida';
    };

    fetchMascotaDetalle();
});