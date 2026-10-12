// layout.js - Menú según el rol, protección de páginas y utilidades compartidas
const TODOS = ["ADMINISTRADOR", "VENDEDOR", "TRABAJADOR"];

const MENU = [
  { texto: "Inicio",      icono: "speedometer2",     ruta: "index.html",             roles: TODOS },
  { texto: "Clientes",    icono: "people",           ruta: "pages/clientes.html",    roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { texto: "Repuestos",   icono: "box-seam",         ruta: "pages/repuestos.html",   roles: TODOS },
  { texto: "Trabajos",    icono: "tools",            ruta: "pages/trabajos.html",    roles: TODOS },
  { texto: "Movimientos", icono: "arrow-left-right", ruta: "pages/movimientos.html", roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { texto: "Catálogo",    icono: "tags",             ruta: "pages/catalogo.html",    roles: ["ADMINISTRADOR"] },
  { texto: "Usuarios",    icono: "person-gear",      ruta: "pages/usuarios.html",    roles: ["ADMINISTRADOR"] },
  { texto: "Reportes",    icono: "bar-chart",        ruta: "pages/reportes.html",    roles: ["ADMINISTRADOR"] },
];

// ----- Protege la página: sin sesión → login; sin permiso → inicio -----
function iniciarPagina(rolesPermitidos = TODOS) {
  const usuario = Sesion.usuario();
  if (!Sesion.token() || !usuario) {
    location.href = RAIZ + "login.html";
    throw new Error("Sin sesión");
  }
  if (!rolesPermitidos.includes(usuario.rol)) {
    location.href = RAIZ + "index.html";
    throw new Error("Sin permiso");
  }
  dibujarMenu(usuario);
  return usuario;
}

// ----- Dibuja el menú solo con las opciones de su rol -----
function dibujarMenu(usuario) {
  const actual = location.pathname.split("/").pop() || "index.html";
  const opciones = MENU.filter(op => op.roles.includes(usuario.rol)).map(op => {
    const activa = op.ruta.endsWith(actual) ? "active" : "";
    return `<li class="nav-item">
              <a class="nav-link ${activa}" href="${RAIZ + op.ruta}"><i class="bi bi-${op.icono} me-1"></i>${op.texto}</a>
            </li>`;
  }).join("");

  document.getElementById("menu").innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark barra sticky-top">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="${RAIZ}index.html">
          <span class="logo-mini"><i class="bi bi-wrench-adjustable"></i></span>El Hospital
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menuPrincipal">
          <ul class="navbar-nav me-auto">${opciones}</ul>
          <div class="d-flex align-items-center gap-2 text-white py-2 py-lg-0">
            <i class="bi bi-person-circle"></i>
            <span class="small">${esc(usuario.nombre)}</span>
            <span class="badge bg-taller">${usuario.rol}</span>
            <button class="btn btn-outline-light btn-sm ms-2" id="btnSalir">
              <i class="bi bi-box-arrow-right"></i> Salir
            </button>
          </div>
        </div>
      </div>
    </nav>`;

  document.getElementById("btnSalir").addEventListener("click", async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    Sesion.cerrar();
    location.href = RAIZ + "login.html";
  });
}

// ----- Utilidades -----
function pesos(valor) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor || 0);
}

function fecha(texto) {
  return texto ? new Date(texto).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "";
}

// Evita que un texto con etiquetas HTML "rompa" la página (seguridad XSS)
function esc(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function cargando() {
  return '<div class="text-center py-5"><div class="spinner-border text-taller"></div></div>';
}
// ----- Llena un <select> con una lista que viene de la API -----
function llenarSelect(select, lista, campoId, campoTexto, textoVacio = null) {
  select.innerHTML = (textoVacio !== null ? `<option value="">${textoVacio}</option>` : "") +
    lista.map(x => `<option value="${x[campoId]}">${esc(x[campoTexto])}</option>`).join("");
}

// ----- Ventana de confirmación bonita (en vez del confirm() del navegador) -----
function confirmar(mensaje) {
  return new Promise(resolve => {
    let modal = document.getElementById("modalConfirmar");
    if (!modal) {
      document.body.insertAdjacentHTML("beforeend", `
        <div class="modal fade" id="modalConfirmar" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
              <div class="modal-body text-center p-4">
                <i class="bi bi-exclamation-triangle text-taller fs-1"></i>
                <p class="mensaje mt-2 mb-0"></p>
              </div>
              <div class="modal-footer justify-content-center border-0 pt-0">
                <button class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                <button class="btn btn-taller btn-si">Sí, continuar</button>
              </div>
            </div>
          </div>
        </div>`);
      modal = document.getElementById("modalConfirmar");
    }
    modal.querySelector(".mensaje").textContent = mensaje;
    const ventana = bootstrap.Modal.getOrCreateInstance(modal);
    let respuesta = false;
    modal.querySelector(".btn-si").onclick = () => { respuesta = true; ventana.hide(); };
    modal.addEventListener("hidden.bs.modal", () => resolve(respuesta), { once: true });
    ventana.show();
  });
}





