// layout.js - Menú, campanita de actividad y funciones que usan todas las páginas
const TODOS = ["ADMINISTRADOR", "VENDEDOR", "TRABAJADOR"];

const MENU = [
  { texto: "Inicio",    icono: "speedometer2", ruta: "index.html",             roles: TODOS },
  { texto: "Clientes",  icono: "people",       ruta: "pages/clientes.html",    roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { texto: "Repuestos", icono: "box-seam",     ruta: "pages/repuestos.html",   roles: TODOS },
  { texto: "Trabajos",  icono: "tools",        ruta: "pages/trabajos.html",    roles: TODOS },
  { texto: "Ventas",    icono: "receipt",      ruta: "pages/movimientos.html", roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { texto: "Catálogo",  icono: "tags",         ruta: "pages/catalogo.html",    roles: ["ADMINISTRADOR"] },
  { texto: "Usuarios",  icono: "person-gear",  ruta: "pages/usuarios.html",    roles: ["ADMINISTRADOR"] },
  { texto: "Reportes",  icono: "bar-chart",    ruta: "pages/reportes.html",    roles: ["ADMINISTRADOR"] },
];

const NOMBRE_ROL = { ADMINISTRADOR: "Administrador", VENDEDOR: "Vendedora", TRABAJADOR: "Mecánico" };

// Foto del encabezado de cada página. Si la foto no existe, se ve un degradado negro y rojo.
const FOTO_PAGINA = { index: "assets/rodolfa.jpg" };   // las demás: assets/fotos/<pagina>.jpg

// Ícono y color de cada tipo de actividad
const ICONOS_ACTIVIDAD = {
  ORDEN: ["clipboard-plus", "azul"],       ASIGNACION: ["person-check", "morado"],
  AVANCE: ["arrow-right-circle", "naranja"], TERMINADO: ["check2-circle", "verde"],
  EDICION: ["pencil", "gris"],             ELIMINACION: ["trash", "rojo"],
  VENTA: ["cart-check", "verde"],          ANULACION: ["x-circle", "rojo"],
  COMPRA: ["truck", "azul"],               INVENTARIO: ["box-seam", "naranja"],
};

// ---------- Sesión y almacenamiento ----------
function leerSesion(campoSesion) {
  const valor = Sesion[campoSesion];
  return typeof valor === "function" ? valor.call(Sesion) : valor;
}
function leerLocal(clave) { try { return localStorage.getItem(clave); } catch (e) { return null; } }
function guardarLocal(clave, valor) { try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ } }

// ---------- Arranque de cada página ----------
function iniciarPagina(rolesPermitidos = TODOS) {
  const yo = leerSesion("usuario");
  if (!leerSesion("token") || !yo) {
    location.href = RAIZ + "login.html";
    throw new Error("Sin sesión");
  }
  if (!rolesPermitidos.includes(yo.rol)) {
    location.href = RAIZ + "index.html";
    throw new Error("Sin permiso");
  }
  cargarFuente();
  dibujarMenu(yo);
  decorarEncabezado();
  if (yo.rol === "ADMINISTRADOR") {
    revisarActividad();
    alActualizar(revisarActividad, 20);
  }
  return yo;
}

function cargarFuente() {
  if (document.getElementById("fuentePoppins")) return;
  const link = document.createElement("link");
  link.id = "fuentePoppins";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}

function dibujarMenu(yo) {
  const actual = location.pathname.split("/").pop() || "index.html";
  const enlaces = MENU.filter(m => m.roles.includes(yo.rol)).map(m => `
    <li class="nav-item">
      <a class="nav-link ${m.ruta.split("/").pop() === actual ? "active" : ""}" href="${RAIZ + m.ruta}">
        <i class="bi bi-${m.icono}"></i> ${m.texto}
      </a>
    </li>`).join("");

  const campana = yo.rol === "ADMINISTRADOR" ? `
    <div class="dropdown">
      <button class="btn btn-campana position-relative" id="btnCampana" data-bs-toggle="dropdown"
              data-bs-auto-close="outside" title="Actividad del taller">
        <i class="bi bi-bell-fill"></i>
        <span class="badge rounded-pill bg-danger d-none" id="contadorCampana">0</span>
      </button>
      <div class="dropdown-menu dropdown-menu-end panel-actividad p-0">
        <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <strong><i class="bi bi-activity text-taller"></i> Actividad del taller</strong>
          <a class="small text-taller" href="${RAIZ}index.html#actividad">Ver todo</a>
        </div>
        <div class="lista-actividad" id="listaCampana"><p class="text-secondary small p-3 mb-0">Cargando...</p></div>
      </div>
    </div>` : "";

  document.getElementById("menu").innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark barra sticky-top">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="${RAIZ}index.html">
          <span class="logo-mini"><i class="bi bi-wrench-adjustable"></i></span>
          <span>El Hospital <i class="bi bi-heart-pulse-fill text-taller"></i></span>
        </a>
        <div class="d-flex align-items-center gap-2 order-lg-last ms-auto ms-lg-3">
          ${campana}
          <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal">
            <span class="navbar-toggler-icon"></span>
          </button>
        </div>
        <div class="collapse navbar-collapse" id="menuPrincipal">
          <ul class="navbar-nav me-auto gap-lg-1 my-2 my-lg-0">${enlaces}</ul>
          <div class="d-flex align-items-center gap-2 text-white py-2 py-lg-0">
            <span class="avatar">${esc(yo.nombre.charAt(0))}</span>
            <div class="lh-sm small">
              <div class="fw-semibold">${esc(yo.nombre.split(" ")[0])}</div>
              <div class="text-white-50" style="font-size:.72rem">${NOMBRE_ROL[yo.rol] || yo.rol}</div>
            </div>
            <button class="btn btn-sm btn-outline-light ms-2" id="btnSalir"><i class="bi bi-box-arrow-right"></i> Salir</button>
          </div>
        </div>
      </div>
    </nav>`;

  document.getElementById("btnSalir").addEventListener("click", async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch (e) { /* igual se sale */ }
    Sesion.cerrar();
    location.href = RAIZ + "login.html";
  });

  const botonCampana = document.getElementById("btnCampana");
  if (botonCampana) botonCampana.addEventListener("show.bs.dropdown", marcarActividadVista);
}

// Pone el encabezado de la página (el bloque del título) con foto y degradado
function decorarEncabezado() {
  const titulo = document.querySelector("main h1");
  const caja = titulo && titulo.closest("main > div");
  if (!caja) return;
  caja.classList.add("encabezado");
  const pagina = (location.pathname.split("/").pop() || "index.html").replace(".html", "");
  const foto = FOTO_PAGINA[pagina] || `assets/fotos/${pagina}.jpg`;
  caja.style.setProperty("--foto", `url("${new URL(RAIZ + foto, location.href).href}")`);
}

// ---------- ACTIVIDAD DEL TALLER (campanita del administrador) ----------
let actividadReciente = [];
let ultimoIdAvisado = null;

function primerNombre(nombre) { return String(nombre || "").split(" ")[0]; }

function hace(texto) {
  const minutos = Math.round((Date.now() - new Date(texto)) / 60000);
  if (minutos < 1) return "justo ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  if (new Date(texto).toDateString() === new Date().toDateString()) return `hoy, ${hora(texto)}`;
  return fechaHora(texto);
}

function itemActividad(a) {
  const [icono, color] = ICONOS_ACTIVIDAD[a.tipo] || ["bell", "gris"];
  return `
    <div class="actividad-item">
      <div class="actividad-icono c-${color}"><i class="bi bi-${icono}"></i></div>
      <div class="flex-grow-1">
        <div><strong>${esc(primerNombre(a.usuario))}</strong> ${esc(a.accion)}</div>
        ${a.detalle ? `<div class="small text-secondary">${esc(a.detalle)}</div>` : ""}
        <div class="actividad-hora"><i class="bi bi-clock"></i> ${hace(a.fecha)}</div>
      </div>
      ${a.monto ? `<div class="fw-bold small text-nowrap">${pesos(a.monto)}</div>` : ""}
    </div>`;
}

async function revisarActividad() {
  const yo = leerSesion("usuario");
  try {
    actividadReciente = await api("/actividad?limite=15");
  } catch (e) {
    return;
  }
  const deOtros = actividadReciente.filter(a => a.usuario !== yo.nombre);
  const vista = Number(leerLocal("actividadVista")) || 0;
  const sinVer = deOtros.filter(a => a.id_actividad > vista).length;

  const contador = document.getElementById("contadorCampana");
  contador.textContent = sinVer > 9 ? "9+" : sinVer;
  contador.classList.toggle("d-none", sinVer === 0);
  document.getElementById("listaCampana").innerHTML = actividadReciente.length
    ? actividadReciente.map(itemActividad).join("")
    : '<p class="text-secondary small p-3 mb-0">Todavía no hay actividad.</p>';

  // Avisos emergentes de lo que pasó mientras la página está abierta
  if (ultimoIdAvisado !== null) {
    const nuevas = deOtros.filter(a => a.id_actividad > ultimoIdAvisado).reverse();
    nuevas.slice(-3).forEach(avisoActividad);
    if (nuevas.length) {
      const boton = document.getElementById("btnCampana");
      boton.classList.remove("sonando");
      void boton.offsetWidth;
      boton.classList.add("sonando");
    }
  }
  const maximo = actividadReciente.length ? actividadReciente[0].id_actividad : 0;
  ultimoIdAvisado = Math.max(ultimoIdAvisado || 0, maximo);
}

function marcarActividadVista() {
  if (actividadReciente.length) guardarLocal("actividadVista", actividadReciente[0].id_actividad);
  document.getElementById("contadorCampana").classList.add("d-none");
}

function avisoActividad(a) {
  let caja = document.getElementById("avisosActividad");
  if (!caja) {
    caja = document.createElement("div");
    caja.id = "avisosActividad";
    caja.className = "toast-container position-fixed bottom-0 start-0 p-3";
    caja.style.zIndex = 1090;
    document.body.appendChild(caja);
  }
  const aviso = document.createElement("div");
  aviso.className = "toast aviso-actividad border-0";
  aviso.innerHTML = `
    <div class="toast-body d-flex gap-2 align-items-start">
      <div class="flex-grow-1">${itemActividad(a)}</div>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
    </div>`;
  caja.appendChild(aviso);
  new bootstrap.Toast(aviso, { delay: 9000 }).show();
  aviso.addEventListener("hidden.bs.toast", () => aviso.remove());
}

// ---------- Formatos ----------
function pesos(valor) {
  return "$ " + Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });
}
function fecha(texto) {
  return texto ? new Date(texto).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "";
}
function fechaHora(texto) {
  return texto ? new Date(texto).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" }) : "";
}
function hora(texto) {
  return texto ? new Date(texto).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" }) : "";
}

// Evita que un texto con < > se convierta en HTML (seguridad XSS)
function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function cargando() {
  return '<div class="text-center text-secondary py-4"><div class="spinner-border text-danger" role="status"></div><div class="small mt-2">Cargando...</div></div>';
}

function llenarSelect(select, lista, campoId, campoTexto, textoVacio) {
  select.innerHTML = (textoVacio !== undefined ? `<option value="">${esc(textoVacio)}</option>` : "") +
    lista.map(item => `<option value="${item[campoId]}">${esc(item[campoTexto])}</option>`).join("");
}

// Ventana "¿Está seguro?" que devuelve true o false
function confirmar(mensaje) {
  return new Promise(resolver => {
    let caja = document.getElementById("modalConfirmar");
    if (!caja) {
      caja = document.createElement("div");
      caja.id = "modalConfirmar";
      caja.className = "modal fade";
      caja.tabIndex = -1;
      caja.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content">
            <div class="modal-body text-center p-4">
              <div class="fs-1 text-taller mb-2"><i class="bi bi-exclamation-octagon"></i></div>
              <p class="mensaje mb-0"></p>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-taller btn-si">Sí, continuar</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(caja);
    }
    caja.querySelector(".mensaje").textContent = mensaje;
    const modal = bootstrap.Modal.getOrCreateInstance(caja);
    let respuesta = false;
    caja.querySelector(".btn-si").onclick = () => { respuesta = true; modal.hide(); };
    caja.addEventListener("hidden.bs.modal", () => resolver(respuesta), { once: true });
    modal.show();
  });
}

// Actualizar la pantalla sola: cada X segundos, al volver a la pestaña o cuando otra pestaña registra algo
function alActualizar(funcion, segundos = 30) {
  window.addEventListener("storage", e => { if (e.key === "datosCambiaron") funcion(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) funcion(); });
  setInterval(() => { if (!document.hidden) funcion(); }, segundos * 1000);
}


