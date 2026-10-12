// api.js - "Mensajero" entre las páginas y la API (FastAPI)
const API_URL = "http://127.0.0.1:8000/api";

// Las páginas de la carpeta pages/ deben subir un nivel para llegar a login.html
const RAIZ = location.pathname.includes("/pages/") ? "../" : "";

// ----- Sesión: guarda el token y los datos del usuario en el navegador -----
const Sesion = {
  guardar(token, usuario) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));
  },
  token() { return localStorage.getItem("token"); },
  usuario() {
    const datos = localStorage.getItem("usuario");
    return datos ? JSON.parse(datos) : null;
  },
  cerrar() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  },
};

// ----- Convierte el error de la API en un mensaje claro para el usuario -----
function mensajeDeError(datos) {
  if (!datos || !datos.detail) return "Ocurrió un error inesperado";
  if (typeof datos.detail === "string") return datos.detail;
  // Error 422 de validación: viene una lista con cada campo que falló
  return datos.detail.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(" · ");
}

// ----- Hace un pedido a la API con fetch() -----
async function api(ruta, opciones = {}) {
  const headers = { "Content-Type": "application/json" };
  if (Sesion.token()) headers["Authorization"] = "Bearer " + Sesion.token();

  let respuesta;
  try {
    respuesta = await fetch(API_URL + ruta, { ...opciones, headers });
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está prendida la API?");
  }

  // 401 = la sesión se venció o el usuario fue desactivado → volver al login
  if (respuesta.status === 401 && ruta !== "/auth/login") {
    Sesion.cerrar();
    location.href = RAIZ + "login.html";
    return;
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new Error(mensajeDeError(datos));
  return datos;
}

// ----- Mensajes de éxito, advertencia y error (toasts de Bootstrap) -----
function mostrarMensaje(tipo, texto) {
  const colores = { exito: "success", advertencia: "warning", error: "danger" };
  const iconos = { exito: "check-circle", advertencia: "exclamation-triangle", error: "x-circle" };

  let contenedor = document.getElementById("mensajes");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "mensajes";
    contenedor.className = "toast-container position-fixed top-0 end-0 p-3";
    document.body.appendChild(contenedor);
  }

  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-bg-${colores[tipo]} border-0`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body"><i class="bi bi-${iconos[tipo]} me-2"></i>${texto}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  contenedor.appendChild(toast);
  new bootstrap.Toast(toast, { delay: 4000 }).show();
}



