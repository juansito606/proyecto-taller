// layout.js - Menú lateral, vitrinas de fotos, efectos, campanita de actividad y funciones comunes
document.documentElement.setAttribute("data-bs-theme", "dark");   // tema oscuro de Bootstrap

const TODOS = ["ADMINISTRADOR", "VENDEDOR", "TRABAJADOR"];

// Cada sección con su ícono y su color
const MENU = [
  { texto: "Inicio",    icono: "speedometer2", ruta: "index.html",             color: "#ef4444", roles: TODOS },
  { texto: "Clientes",  icono: "people",       ruta: "pages/clientes.html",    color: "#a855f7", roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { texto: "Repuestos", icono: "box-seam",     ruta: "pages/repuestos.html",   color: "#f97316", roles: TODOS },
  { texto: "Trabajos",  icono: "tools",        ruta: "pages/trabajos.html",    color: "#3b82f6", roles: TODOS },
  { texto: "Ventas",    icono: "receipt",      ruta: "pages/movimientos.html", color: "#22c55e", roles: ["ADMINISTRADOR", "VENDEDOR"] },
  { texto: "Catálogo",  icono: "tags",         ruta: "pages/catalogo.html",    color: "#eab308", roles: ["ADMINISTRADOR"] },
  { texto: "Usuarios",  icono: "person-gear",  ruta: "pages/usuarios.html",    color: "#06b6d4", roles: ["ADMINISTRADOR"] },
  { texto: "Reportes",  icono: "bar-chart",    ruta: "pages/reportes.html",    color: "#ec4899", roles: ["ADMINISTRADOR"] },
];

const NOMBRE_ROL = { ADMINISTRADOR: "Administrador", VENDEDOR: "Vendedora", TRABAJADOR: "Mecánico" };

const ICONOS_ACTIVIDAD = {
  ORDEN: ["clipboard-plus", "azul"],         ASIGNACION: ["person-check", "morado"],
  AVANCE: ["arrow-right-circle", "naranja"], TERMINADO: ["check2-circle", "verde"],
  EDICION: ["pencil", "gris"],               ELIMINACION: ["trash", "rojo"],
  VENTA: ["cart-check", "verde"],            ANULACION: ["x-circle", "rojo"],
  COMPRA: ["truck", "azul"],                 INVENTARIO: ["box-seam", "naranja"],
};

// ---------- Sesión y almacenamiento ----------
function leerSesion(campoSesion) {
  const valor = Sesion[campoSesion];
  return typeof valor === "function" ? valor.call(Sesion) : valor;
}
function leerLocal(clave) { try { return localStorage.getItem(clave); } catch (e) { return null; } }
function guardarLocal(clave, valor) { try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ } }

function nombreDePagina(ruta) {
  return (ruta.split("/").pop() || "index.html").replace(".html", "");
}
function paginaActual() {
  return nombreDePagina(location.pathname);
}
function seccionDe(pagina) {
  return MENU.find(m => nombreDePagina(m.ruta) === pagina) || MENU[0];
}

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
  const seccion = seccionDe(paginaActual());
  document.body.classList.add("con-lateral");
  document.body.style.setProperty("--acento", seccion.color);   // cada página con su color

  cargarFuente();
  crearFondo();
  dibujarMenu(yo);
  decorarEncabezado(seccion);
  activarEfectos();
  setTimeout(() => document.body.classList.add("listo"), 1600);   // las filas se animan solo al entrar

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
  link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Poppins:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(link);
}

// ---------- FOTOS DEL TALLER ----------
// Cada página busca en assets/fotos/:  <pagina>.jpg, <pagina>2.jpg, <pagina>3.jpg
// (el inicio usa assets/rodolfa.jpg). Si una página no tiene fotos, simplemente no muestra vitrina.
function rutasDeFotos(pagina) {
  const rutas = ["", "2", "3"].map(n => `assets/fotos/${pagina}${n}.jpg`);
  return pagina === "index" ? ["assets/rodolfa.jpg", ...rutas] : rutas;
}

function probarFoto(ruta) {
  return new Promise(listo => {
    const imagen = new Image();
    imagen.onload = () => listo({ src: imagen.src, ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
    imagen.onerror = () => listo(null);
    imagen.src = RAIZ + ruta;
  });
}

function buscarFotos(rutas) {
  return Promise.all(rutas.map(probarFoto)).then(lista => lista.filter(Boolean));
}

// Fondo: manchas de luz del color de la sección (sin fotos, para que no se repitan)
function crearFondo() {
  const fondo = document.createElement("div");
  fondo.id = "fondo";
  fondo.innerHTML = '<div class="mancha m1"></div><div class="mancha m2"></div><div class="mancha m3"></div><div class="puntos"></div>';
  document.body.prepend(fondo);
}

// Encabezado: el texto a la izquierda y la vitrina de fotos de la sección a la derecha
function decorarEncabezado(seccion) {
  const titulo = document.querySelector("main h1");
  const caja = titulo && titulo.closest("main > div");
  if (!caja) return;
  caja.classList.add("encabezado");
  if (!caja.querySelector(".etiqueta")) {
    titulo.insertAdjacentHTML("beforebegin",
      `<span class="etiqueta"><i class="bi bi-${seccion.icono}"></i> El Hospital · ${seccion.texto}</span>`);
  }
  const texto = document.createElement("div");
  texto.className = "hero-texto";
  while (caja.firstChild) texto.appendChild(caja.firstChild);
  caja.appendChild(texto);

  const marco = document.createElement("div");
  marco.className = "vitrina d-none";
  marco.title = "Clic para ver en grande";
  caja.appendChild(marco);
  buscarFotos(rutasDeFotos(paginaActual())).then(fotos => montarVitrina(caja, marco, fotos, seccion));
}

// Cada sección tiene su propio estilo de vitrina
const VITRINAS = {
  index: "cine", trabajos: "polaroid", repuestos: "circulo", movimientos: "diagonal",
  clientes: "tarjeta", catalogo: "mosaico", reportes: "pantalla",
};
const LEYENDAS = ["Manos a la obra", "Lista pa' rodar", "Con cariño"];

function montarVitrina(caja, marco, fotos, seccion) {
  if (!fotos.length) return;
  const estilo = VITRINAS[paginaActual()] || "tarjeta";
  const img = (foto, i) => `<img src="${foto.src}" alt="Foto de ${esc(seccion.texto)}" data-indice="${i}">`;
  const dos = fotos.slice(0, 2);
  const plantillas = {
    cine: () => img(fotos[0], 0),
    polaroid: () => dos.map((f, i) => `
      <figure class="polaroid p${i}">${img(f, i)}<figcaption>${LEYENDAS[i]}</figcaption></figure>`).join(""),
    circulo: () => `
      <div class="anillo"></div>
      <div class="circulo-foto">${img(fotos[0], 0)}</div>
      <span class="chip-flotante c1"><i class="bi bi-disc"></i> Frenos</span>
      <span class="chip-flotante c2"><i class="bi bi-gear-fill"></i> Motor</span>
      <span class="chip-flotante c3"><i class="bi bi-droplet-fill"></i> Lubricantes</span>`,
    diagonal: () => dos.map((f, i) => `<div class="lado l${i}">${img(f, i)}</div>`).join("") +
      (dos.length > 1 ? '<span class="raya"></span>' : "") +
      '<span class="chip-flotante abajo"><i class="bi bi-cart-check-fill"></i> Repuestos + mano de obra</span>',
    tarjeta: () => `
      <div class="tarjeta-cliente">${img(fotos[0], 0)}
        <div class="tarjeta-texto"><i class="bi bi-heart-fill"></i> Clientes de la casa
          <small>Cada moto, como si fuera nuestra</small></div>
      </div>`,
    mosaico: () => dos.map((f, i) => `<div class="tesela t${i}">${img(f, i)}<span class="numero">0${i + 1}</span></div>`).join(""),
    pantalla: () => `
      <div class="monitor">${img(fotos[0], 0)}
        <span class="en-directo">● EN VIVO</span>
        <div class="mini-barras"><i></i><i></i><i></i><i></i><i></i></div>
      </div>
      <div class="base-monitor"></div>`,
  };
  marco.innerHTML = plantillas[estilo]();
  marco.classList.remove("d-none");
  marco.classList.add(`vitrina-${estilo}`);
  if (fotos.length === 1) marco.classList.add("una");
  if (estilo === "cine") caja.classList.add("con-cine");

  // Clic en cualquier foto: se ve completa y en grande
  marco.addEventListener("click", evento => {
    const imagen = evento.target.closest("img");
    abrirVisor(fotos.map(f => ({ ...f, titulo: seccion.texto })), imagen ? Number(imagen.dataset.indice) : 0);
  });
}

// Visor: la foto completa en grande, con flechas (también con el teclado ← →)
let visor = null;
let fotosVisor = [];
let indiceVisor = 0;
function abrirVisor(fotos, indice = 0) {
  fotosVisor = fotos;
  indiceVisor = indice;
  if (!visor) {
    const caja = document.createElement("div");
    caja.className = "modal fade visor";
    caja.tabIndex = -1;
    caja.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content bg-transparent border-0 shadow-none">
          <button type="button" class="btn-close btn-close-white visor-cerrar" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          <img class="visor-img" alt="">
          <div class="visor-pie"><span class="visor-titulo"></span><span class="visor-contador"></span></div>
          <button type="button" class="visor-flecha izquierda"><i class="bi bi-chevron-left"></i></button>
          <button type="button" class="visor-flecha derecha"><i class="bi bi-chevron-right"></i></button>
        </div>
      </div>`;
    document.body.appendChild(caja);
    caja.querySelector(".izquierda").addEventListener("click", () => moverVisor(-1));
    caja.querySelector(".derecha").addEventListener("click", () => moverVisor(1));
    caja.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft") moverVisor(-1);
      if (e.key === "ArrowRight") moverVisor(1);
    });
    visor = { caja, modal: new bootstrap.Modal(caja) };
  }
  pintarVisor();
  visor.modal.show();
}
function moverVisor(paso) {
  indiceVisor = (indiceVisor + paso + fotosVisor.length) % fotosVisor.length;
  pintarVisor();
}
function pintarVisor() {
  const foto = fotosVisor[indiceVisor];
  visor.caja.querySelector(".visor-img").src = foto.src;
  visor.caja.querySelector(".visor-titulo").textContent = foto.titulo || "";
  visor.caja.querySelector(".visor-contador").textContent = `${indiceVisor + 1} / ${fotosVisor.length}`;
  visor.caja.querySelectorAll(".visor-flecha").forEach(b => b.classList.toggle("d-none", fotosVisor.length < 2));
}

// ---------- Menú lateral ----------
function dibujarMenu(yo) {
  const actual = paginaActual();
  const enlaces = MENU.filter(m => m.roles.includes(yo.rol)).map(m => `
    <a class="lateral-link ${nombreDePagina(m.ruta) === actual ? "activo" : ""}"
       href="${RAIZ + m.ruta}" style="--color:${m.color}">
      <span class="burbuja"><i class="bi bi-${m.icono}"></i></span>
      <span>${m.texto}</span>
      <i class="bi bi-chevron-right flecha"></i>
    </a>`).join("");

  const campana = yo.rol === "ADMINISTRADOR" ? `
    <div class="campana-flotante dropdown">
      <button class="btn btn-campana position-relative" id="btnCampana" data-bs-toggle="dropdown"
              data-bs-auto-close="outside" title="Actividad del taller">
        <i class="bi bi-bell-fill"></i>
        <span class="badge rounded-pill bg-danger d-none" id="contadorCampana">0</span>
      </button>
      <div class="dropdown-menu dropdown-menu-end panel-actividad p-0">
        <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-secondary-subtle">
          <strong><i class="bi bi-activity text-taller"></i> Actividad del taller</strong>
          <a class="small text-taller" href="${RAIZ}index.html#actividad">Ver todo</a>
        </div>
        <div class="lista-actividad" id="listaCampana"><p class="text-secondary small p-3 mb-0">Cargando...</p></div>
      </div>
    </div>` : "";

  document.getElementById("menu").innerHTML = `
    <div class="barra-movil d-lg-none">
      <button class="btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#lateral" aria-label="Abrir menú">
        <i class="bi bi-list"></i>
      </button>
      <span class="logo-mini"><i class="bi bi-wrench-adjustable"></i></span> El Hospital
    </div>

    <aside class="offcanvas-lg offcanvas-start lateral" tabindex="-1" id="lateral">
      <div class="offcanvas-body">
        <div class="d-flex align-items-start justify-content-between">
          <a class="lateral-marca" href="${RAIZ}index.html">
            <span class="logo-mini"><i class="bi bi-wrench-adjustable"></i></span>
            <span>El Hospital <i class="bi bi-heart-pulse-fill text-taller"></i></span>
          </a>
          <button type="button" class="btn-close btn-close-white d-lg-none mt-2" data-bs-dismiss="offcanvas" data-bs-target="#lateral"></button>
        </div>

        <div class="lateral-usuario">
          <span class="avatar">${esc(yo.nombre.charAt(0))}</span>
          <div class="lh-sm overflow-hidden">
            <div class="fw-semibold text-truncate">${esc(yo.nombre)}</div>
            <span class="rol-pill">${NOMBRE_ROL[yo.rol] || yo.rol}</span>
          </div>
        </div>

        <div class="lateral-titulo">Menú</div>
        <nav>${enlaces}</nav>

        <div class="lateral-pie">
          <button class="btn btn-salir" id="btnSalir"><i class="bi bi-box-arrow-left"></i> Cerrar sesión</button>
        </div>
      </div>
    </aside>
    ${campana}`;

  document.getElementById("btnSalir").addEventListener("click", async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch (e) { /* igual se sale */ }
    Sesion.cerrar();
    location.href = RAIZ + "login.html";
  });

  const botonCampana = document.getElementById("btnCampana");
  if (botonCampana) botonCampana.addEventListener("show.bs.dropdown", marcarActividadVista);
}

// ---------- Efectos: tarjetas 3D y números que cuentan ----------
function activarEfectos() {
  let tarjetaInclinada = null;
  document.addEventListener("mousemove", evento => {
    const tarjeta = evento.target.closest ? evento.target.closest(".kpi") : null;
    if (tarjetaInclinada && tarjetaInclinada !== tarjeta) tarjetaInclinada.style.transform = "";
    tarjetaInclinada = tarjeta;
    if (!tarjeta) return;
    const caja = tarjeta.getBoundingClientRect();
    const px = (evento.clientX - caja.left) / caja.width;
    const py = (evento.clientY - caja.top) / caja.height;
    tarjeta.style.transform = `perspective(700px) rotateY(${(px - .5) * 12}deg) rotateX(${(.5 - py) * 12}deg) translateY(-4px)`;
    tarjeta.style.setProperty("--brillo-x", `${px * 100}%`);
    tarjeta.style.setProperty("--brillo-y", `${py * 100}%`);
  });

  // Los números de las tarjetas cuentan hasta su valor (y vuelven a contar si cambian)
  const ultimos = {};
  new MutationObserver(() => {
    document.querySelectorAll(".kpi-valor:not([data-contado])").forEach(elemento => {
      elemento.dataset.contado = "1";
      const texto = elemento.textContent.trim();
      if (texto.includes("%")) return;
      const titulo = (elemento.parentElement.querySelector(".kpi-titulo") || {}).textContent || texto;
      const destino = Number(texto.replace(/[^\d]/g, "")) || 0;
      const esDinero = texto.includes("$");
      const desde = ultimos[titulo] ?? 0;
      ultimos[titulo] = destino;
      if (desde === destino) return;
      const inicio = performance.now();
      const paso = ahora => {
        const t = Math.min(1, (ahora - inicio) / 900);
        const valor = desde + (destino - desde) * (1 - Math.pow(1 - t, 3));
        elemento.textContent = esDinero ? pesos(valor) : String(Math.round(valor));
        if (t < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
  }).observe(document.body, { childList: true, subtree: true });

  // Para imprimir los reportes se pasa a tema claro
  window.addEventListener("beforeprint", () => document.documentElement.setAttribute("data-bs-theme", "light"));
  window.addEventListener("afterprint", () => document.documentElement.setAttribute("data-bs-theme", "dark"));
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
    caja.className = "toast-container position-fixed bottom-0 end-0 p-3";
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
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
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
