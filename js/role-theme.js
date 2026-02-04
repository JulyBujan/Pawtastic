document.addEventListener("DOMContentLoaded", () => {
  const tipo = localStorage.getItem("tipo");
  if (!tipo) {
    return;
  }
  if (tipo === "usuario") {
    document.body.classList.add("role-usuario");
  }
  if (tipo === "ong") {
    document.body.classList.add("role-ong");
  }
});
