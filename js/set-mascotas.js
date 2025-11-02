document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idMascota = params.get('id');
    document.getElementById('id_mascota').value = idMascota;

    if (!idMascota) {
      showToast('ID de mascota no encontrado.', 'danger');
      window.location.href = 'mis-mascotas.html';
      return;
    }

    try {
      const response = await fetch(`../api/get_mascota.php?id=${idMascota}`);
      if (!response.ok) throw new Error('No se pudo cargar la información de la mascota.');
      
      const mascota = await response.json();

      document.getElementById('nombre').value = mascota.nombre;
      document.getElementById('tipo').value = mascota.tipo;
      document.getElementById('edad').value = mascota.edad;
      document.getElementById('sexo').value = mascota.sexo;
      document.getElementById('tamaño').value = mascota.tamaño;
      document.getElementById('descripcion').value = mascota.descripcion;
      document.getElementById('vacunado').value = mascota.vacunado;
      document.getElementById('esterilizado').value = mascota.esterilizado;
      document.getElementById('chip').value = mascota.chip;
      document.getElementById('energia').value = mascota.energia;
      document.getElementById('sociabilidad').value = mascota.sociabilidad;
      document.getElementById('presencia').value = mascota.presencia;
      document.getElementById('estilov').value = mascota.estilov;
      if(mascota.imagen) {
          document.getElementById('foto_actual').src = `../img/mascotas/${mascota.imagen}`;
      }

    } catch (error) {
      console.error('Error:', error);
      showToast(error.message, 'danger');
    }
  });

  document.getElementById('formEditarMascota').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('id', document.getElementById('id_mascota').value);
    formData.append('nombre', document.getElementById('nombre').value);
    formData.append('tipo', document.getElementById('tipo').value);
    formData.append('edad', document.getElementById('edad').value);
    formData.append('sexo', document.getElementById('sexo').value);
    formData.append('tamaño', document.getElementById('tamaño').value);
    formData.append('descripcion', document.getElementById('descripcion').value);
    formData.append('vacunado', document.getElementById('vacunado').value);
    formData.append('esterilizado', document.getElementById('esterilizado').value);
    formData.append('chip', document.getElementById('chip').value);
    formData.append('energia', document.getElementById('energia').value);
    formData.append('sociabilidad', document.getElementById('sociabilidad').value);
    formData.append('presencia', document.getElementById('presencia').value);
    formData.append('estilov', document.getElementById('estilov').value);

    const fotoInput = document.getElementById('foto');
    if (fotoInput.files[0]) {
      formData.append('imagen', fotoInput.files[0]);
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showToast("Error: No estás autenticado.", "danger");
      window.location.href = 'login.html';
      return;
    }

    try {
      const response = await fetch('../api/editar_mascota.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        showToast(result.message, 'success');
        window.location.href = 'mis-mascotas.html';
      } else {
        throw new Error(result.message || 'Error al editar la mascota');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast(`Error: ${error.message}`, 'danger');
    }
  });

  function confirmarSalida() {
    if (confirm("¿Estás segura que querés salir?")) {
      localStorage.removeItem('token');
      window.location.href = "../index.html";
    }
  }