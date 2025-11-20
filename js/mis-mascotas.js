document.addEventListener("DOMContentLoaded", () => {
  const mascotasGrid = document.getElementById("contenedorMascotas");
  const token = localStorage.getItem("token");

  if (!token) {
    mascotasGrid.innerHTML =
      "<p class='text-danger text-center'>⚠️ Debes iniciar sesión para ver tus mascotas.</p>";
    return;
  }

  const fetchMascotas = async () => {
    try {
      const response = await fetch(`../api/get_mascota.php`, {
        headers: { Authorization: "Bearer " + token },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error al cargar las mascotas");
      }

      const data = await response.json();
      renderMascotas(data);
    } catch (error) {
      mascotasGrid.innerHTML = `<p class="text-center text-danger">${error.message}</p>`;
    }
  };

  const renderMascotas = (mascotas) => {
    mascotasGrid.innerHTML = "";
    if (mascotas.length === 0) {
      mascotasGrid.innerHTML =
        '<p class="text-center text-muted">No has publicado ninguna mascota todavía.</p>';
      return;
    }

    mascotas.forEach((mascota) => {
      const card = `
                <div class="col">
                    <div class="card h-100 shadow-sm">
                        <img src="../img/mascotas/${
                          mascota.imagen || "default.jpg"
                        }" class="card-img-top"  alt="${mascota.nombre}" />
                        <div class="card-body d-flex flex-column justify-content-between text-center">
                            <h5 class="card-title">${mascota.nombre}</h5>
                            <p class="card-text">${mascota.descripcion.substring(
                              0,
                              100
                            )}...</p>
                            <div class="d-flex justify-content-around mt-auto"> 
                                <a href="./gestionar-mascota.html?id=${
                                  mascota.id
                                }" class="btn btn-outline-primary btn-sm" title="Editar"><i class="bi bi-pencil"></i></a>
                                <button class="btn btn-outline-danger btn-sm" onclick="confirmarEliminacion(${
                                  mascota.id
                                })" title="Eliminar"><i class="bi bi-trash"></i></button>
                                <button class="btn btn-outline-info btn-sm" onclick='estimarAdopcion(${JSON.stringify(mascota).replace(/'/g, "&apos;")})' title="Estimar Adopción"><i class="bi bi-graph-up"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      mascotasGrid.innerHTML += card;
    });

    // Añadir el contenedor del modal al final del body si no existe
    if (!document.getElementById('predictionModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="predictionModal" tabindex="-1" aria-labelledby="predictionModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="predictionModalLabel">Estimación de Adopción</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="predictionModalBody">
                <p>Cargando estimación...</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      `);
    }
  };

  fetchMascotas();
});

function confirmarEliminacion(id) {
  if (!confirm("¿Estás seguro de que quieres eliminar esta mascota?")) {
    return;
  }
  eliminarMascota(id);
}

async function eliminarMascota(id) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`../api/gestionar_mascota.php?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });

    if (response.ok) {
      showToast("Mascota eliminada con éxito", "success");
      location.reload();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al eliminar la mascota");
    }
  } catch (error) {
    showToast(error.message, "danger");
  }
}

async function estimarAdopcion(mascota) {
  const modalElement = document.getElementById('predictionModal');
  const modalBody = document.getElementById('predictionModalBody');
  const predictionModal = new bootstrap.Modal(modalElement);

  modalBody.innerHTML = '<div class="d-flex justify-content-center align-items-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><strong class="ms-3">Calculando...</strong></div>';
  predictionModal.show();

  // --- Mapeo de datos ---
  const animaltype = mascota.tipo.toLowerCase() === 'perro' ? 1 : 0;
  const gender = mascota.sexo.toLowerCase() === 'macho' ? 1 : 0;
  
  const sizeMap = {
    'cachorro': 0, 'miniatura': 0,
    'pequeño': 1,
    'mediano': 2,
    'grande': 3,
    'muy grande': 4
  };
  const petsize = sizeMap[mascota.tamaño.toLowerCase()] ?? 2; // Default a mediano

  // --- Lógica para raza y color ---
  // La API espera valores específicos. Aquí simplificamos buscando coincidencias parciales.
  // En un caso real, esto podría requerir una normalización más robusta.
  const breed = mascota.breed || 'Others'; // Usamos el campo 'breed' que ahora viene de la API
  const color = mascota.color || 'Others'; // Asumimos que 'color' viene del objeto mascota

  const payload = {
    animaltype,
    gender,
    petsize,
    breed,
    color
  };

  try {
    const response = await fetch('https://mlapi.pawtastic.pet/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error en la API de predicción.');
    }

    const prediction = await response.json();

    // --- Cálculo de días restantes ---
    const diasEstimados = prediction.dias_estimados;
    const fechaPublicacion = new Date(mascota.date_publicacion);
    const hoy = new Date();
    const diffTime = Math.abs(hoy - fechaPublicacion);
    const diasPasados = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const diasRestantes = Math.max(0, Math.round(diasEstimados - diasPasados));

    // --- Mostrar resultados ---
    modalBody.innerHTML = `
      <h6 class="card-title text-center mb-3">Resultados para: <strong>${mascota.nombre}</strong></h6>
      <ul class="list-group list-group-flush">
        <li class="list-group-item d-flex justify-content-between align-items-center">
          Días estimados restantes:
          <span class="badge bg-primary rounded-pill fs-6">${diasRestantes}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center">
          Rango de adopción:
          <span class="badge bg-info text-dark rounded-pill">${prediction.rango_estimado}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center">
          Confianza del modelo:
          <span class="badge bg-success rounded-pill">${prediction.confianza_modelo}</span>
        </li>
        <li class="list-group-item">
          <small class="text-muted">
            La estimación original fue de ${prediction.dias_estimados} días. Han pasado ${diasPasados} día(s) desde su publicación.
          </small>
        </li>
      </ul>
      <div class="alert alert-secondary mt-3" role="alert">
        <small><i class="bi bi-info-circle-fill"></i> Esta es una estimación basada en un modelo de Machine Learning y no garantiza el tiempo real de adopción.</small>
      </div>
    `;

  } catch (error) {
    modalBody.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}
