// login.js - Inicio de sesión
const formulario = document.getElementById("formLogin");
const boton = document.getElementById("btnIngresar");

// Si ya hay sesión abierta, ir directo al inicio
if (Sesion.token()) location.href = "index.html";

// Mostrar u ocultar la contraseña
document.getElementById("verContrasena").addEventListener("click", () => {
  const campo = document.getElementById("contrasena");
  campo.type = campo.type === "password" ? "text" : "password";
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  // 1. Validación en el frontend (antes de molestar a la API)
  if (!formulario.checkValidity()) {
    formulario.classList.add("was-validated");
    return;
  }

  // 2. Botón en modo "cargando"
  boton.disabled = true;
  boton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...';

  try {
    // 3. Pedir el login a la API
    const respuesta = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        usuario: document.getElementById("usuario").value.trim().toLowerCase(),
        contrasena: document.getElementById("contrasena").value,
      }),
    });

    // 4. Guardar la sesión e ir al inicio
    Sesion.guardar(respuesta.token, respuesta.usuario);
    location.href = "index.html";
  } catch (error) {
    mostrarMensaje("error", error.message);
    boton.disabled = false;
    boton.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Ingresar';
  }
});


