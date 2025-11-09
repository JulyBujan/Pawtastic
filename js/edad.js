// Escucha el evento del formulario
document
  .getElementById("formCalculadora")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const edad = parseFloat(document.getElementById("edadMascota").value);
    const tipo = document.querySelector('input[name="tipo"]:checked').value;
    let resultado = "";

    if (isNaN(edad) || edad <= 0) {
      resultado = "Por favor, ingresá una edad válida 🐾";
    } else {
      let edadHumana = 0;

      if (edad <= 2) {
        edadHumana = edad * 12;
      } else {
        edadHumana = 24 + (edad - 2) * (tipo === "perro" ? 4 : 4.5);
      }

      resultado = `Tu ${tipo} tiene aproximadamente <span class="text-primary">${edadHumana.toFixed(
        1
      )}</span> años humanos 🧡`;

      // Mostrar el botón de reinicio
      document.getElementById("reiniciar").classList.remove("d-none");
    }

    // Mostrar el resultado
    document.getElementById("resultado").innerHTML = resultado;
  });

// Escucha el botón "Hacer otro cálculo"
document.getElementById("reiniciar").addEventListener("click", function () {
  document.getElementById("formCalculadora").reset(); // Limpia los campos
  document.getElementById("resultado").innerHTML = ""; // Limpia el resultado
  this.classList.add("d-none"); // Oculta el botón
});
