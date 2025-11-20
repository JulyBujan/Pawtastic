document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const idMascota = params.get("id");
  const formMascota = document.getElementById("form-mascota");

  // Referencias a los nuevos campos de edad
  const edadAnosInput = document.getElementById("edad_anos");
  const edadMesesInput = document.getElementById("edad_meses");

  const token = localStorage.getItem("token");
  const tipoUsuario = localStorage.getItem("tipo");

  // --- Verificación de seguridad ---
  if (!token || tipoUsuario !== "ong") {
    showToast(
      "⚠️ Debes iniciar sesión como ONG para acceder a esta página.",
      "danger"
    );
    window.location.href = "login.html";
    return;
  }

  // --- Lógica de Modo (Crear vs. Editar) ---
  if (idMascota) {
    // MODO EDICIÓN
    setupEditMode(idMascota);
  } else {
    // MODO CREACIÓN: Solución definitiva para anular el autocompletado del navegador.
    setTimeout(() => {
      // 1. Limpia campos de texto, números, etc.
      formMascota.reset();

      // 2. Forzamos el reseteo de TODOS los menús desplegables a su primera opción.
      // Esto es crucial para que los campos de "Personalidad" y "Datos Adicionales" se limpien correctamente.
      const todosLosSelects = formMascota.querySelectorAll("select");
      todosLosSelects.forEach((select) => (select.selectedIndex = 0));
    }, 100); // El retraso es clave para ejecutarse después del autocompletado.
  }

  // --- Configuración para el Modo Edición ---
  async function setupEditMode(id) {
    // Cambiar textos en la UI
    document.getElementById("page-title").textContent =
      "Editar Mascota | Pawtastic";
    document.getElementById("form-title").textContent = "Editar Mascota";
    document.getElementById("submit-btn").textContent = "Guardar Cambios";
    document.getElementById("vacunas-section").style.display = "block";
    document.getElementById("foto-label").textContent =
      "Cambiar Foto (opcional)";

    try {
      const response = await fetch(`../api/get_mascota.php?id=${id}`);
      if (!response.ok)
        throw new Error("No se pudo cargar la información de la mascota.");

      const mascota = await response.json();

      // Rellenar el formulario
      document.getElementById("id_mascota").value = id;
      document.getElementById("nombre").value = mascota.nombre;
      document.getElementById("tipo").value = mascota.tipo;

      // Convertir la edad (que se asume guardada en meses) a años y meses
      const totalMeses = parseInt(mascota.edad, 10) || 0;
      edadAnosInput.value = Math.floor(totalMeses / 12);
      edadMesesInput.value = totalMeses % 12;

      document.getElementById("sexo").value = mascota.sexo;
      document.getElementById("tamaño").value = mascota.tamaño;
      document.getElementById("breed").value = mascota.breed; // Seleccionar raza
      document.getElementById("color").value = mascota.color; // Seleccionar color
      document.getElementById("descripcion").value = mascota.descripcion;
      document.getElementById("vacunado").value = mascota.vacunado;
      document.getElementById("esterilizado").value = mascota.esterilizado;
      document.getElementById("chip").value = mascota.chip;
      document.getElementById("apto_ninos").value = parseInt(
        mascota.apto_ninos
      ); // Aseguramos que sea 1 o 0
      document.getElementById("apto_mascotas").value = parseInt(
        mascota.apto_mascotas
      ); // Aseguramos que sea 1 o 0
      document.getElementById("energia").value = mascota.energia;
      document.getElementById("sociabilidad").value = mascota.sociabilidad;
      document.getElementById("presencia").value = mascota.presencia;
      document.getElementById("estilov").value = mascota.estilov;

      if (mascota.imagen) {
        const fotoContainer = document.getElementById("foto-actual-container");
        const fotoActual = document.getElementById("foto_actual");
        fotoActual.src = `../img/mascotas/${mascota.imagen}`;
        fotoContainer.style.display = "block";
      }

      // Cargar vacunas
      await cargarVacunas(id);
    } catch (error) {
      console.error("Error:", error);
      showToast(error.message, "danger");
      // Redirigir si no se pueden cargar los datos
      window.location.href = "mis-mascotas.html";
    }
  }

  // --- Lógica de Vacunas ---
  async function cargarVacunas(mascotaId) {
    try {
      const response = await fetch(`../api/gestionar_mascota_vacunas.php?mascota_id=${mascotaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("No se pudieron cargar las vacunas.");

      const data = await response.json();
      renderTablaVacunas(data.aplicadas);
      popularSelectVacunas(data.todas);

      // Si hay al menos una vacuna, marcar como "Sí" el campo vacunado
      if (data.aplicadas.length > 0) {
        document.getElementById("vacunado").value = "si";
      }
    } catch (error) {
      showToast(error.message, "danger");
    }
  }

  function renderTablaVacunas(vacunasAplicadas) {
    const tbody = document.getElementById("tabla-vacunas-body");
    tbody.innerHTML = "";
    if (vacunasAplicadas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay vacunas registradas.</td></tr>';
      return;
    }
    vacunasAplicadas.forEach(vacuna => {
      const fecha = new Date(vacuna.fecha_aplicacion + 'T00:00:00').toLocaleDateString();
      const row = `
        <tr>
          <td>${vacuna.nombre}</td>
          <td>${fecha}</td>
          <td>
            <button class="btn btn-danger btn-sm btn-eliminar-vacuna" data-vacuna-id="${vacuna.id_vacuna}" data-fecha="${vacuna.fecha_aplicacion}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`;
      tbody.innerHTML += row;
    });

    // Añadir listeners a los botones de eliminar
    document.querySelectorAll('.btn-eliminar-vacuna').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const vacunaId = e.currentTarget.dataset.vacunaId;
        const fecha = e.currentTarget.dataset.fecha;
        if (confirm('¿Seguro que quieres eliminar esta vacuna?')) {
          await eliminarVacuna(idMascota, vacunaId, fecha);
        }
      });
    });
  }

  function popularSelectVacunas(todasLasVacunas) {
    const select = document.getElementById("select-vacuna");
    select.innerHTML = '<option value="">Seleccionar vacuna...</option>';
    const tipoMascota = document.getElementById("tipo").value;
    todasLasVacunas
      .filter(v => v.tipo === tipoMascota)
      .forEach(vacuna => {
        select.innerHTML += `<option value="${vacuna.id_vacuna}">${vacuna.nombre}</option>`;
      });
  }

  async function agregarVacuna(mascotaId, vacunaId, fecha) {
    try {
      const response = await fetch('../api/gestionar_mascota_vacunas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mascota_id: mascotaId, vacuna_id: vacunaId, fecha_aplicacion: fecha })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      showToast(result.message, 'success');
      await cargarVacunas(mascotaId); // Recargar
      bootstrap.Modal.getInstance(document.getElementById('modalAgregarVacuna')).hide();
    } catch (error) {
      showToast(`Error: ${error.message}`, 'danger');
    }
  }

  async function eliminarVacuna(mascotaId, vacunaId, fecha) {
    try {
      const response = await fetch('../api/gestionar_mascota_vacunas.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mascota_id: mascotaId, vacuna_id: vacunaId, fecha_aplicacion: fecha })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      showToast(result.message, 'success');
      await cargarVacunas(mascotaId); // Recargar
    } catch (error) {
      showToast(`Error: ${error.message}`, 'danger');
    }
  }

  document.getElementById('btn-guardar-vacuna').addEventListener('click', async () => {
    const vacunaId = document.getElementById('select-vacuna').value;
    const fecha = document.getElementById('fecha-aplicacion-vacuna').value;
    if (vacunaId && fecha) {
      await agregarVacuna(idMascota, vacunaId, fecha);
    } else {
      showToast('Por favor, selecciona una vacuna y una fecha.', 'warning');
    }
  });

  // --- Manejador del botón Cancelar ---
  const btnCancelar = document.getElementById("btn-cancelar");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      formMascota.reset();
      window.location.href = "perfil-ong.html";
    });
  }

  // --- Manejador del envío del formulario ---
  formMascota.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Antes de enviar, calcular la edad total en meses y asignarla al campo original oculto
    const anos = parseInt(edadAnosInput.value, 10) || 0;
    const meses = parseInt(edadMesesInput.value, 10) || 0;
    document.getElementById("edad").value = anos * 12 + meses;

    const formData = new FormData(formMascota);

    // El token ya está verificado al inicio de la carga del script

    try {
      const response = await fetch("../api/gestionar_mascota.php", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showToast(result.message, "success");
        formMascota.reset(); // Limpia todos los campos del formulario
        // Redirigir a la lista de mascotas tras el éxito
        setTimeout(() => {
          window.location.href = "mis-mascotas.html";
        }, 1500); // Pequeño delay para que el usuario vea el toast
      } else {
        throw new Error(result.message || "Ocurrió un error desconocido.");
      }
    } catch (error) {
      console.error("Error al guardar la mascota:", error);
      showToast(`Error: ${error.message}`, "danger");
    }
  });
});

function confirmarSalida() {
  if (confirm("¿Estás segura que querés salir?")) {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
  }
}
