// dashboard.js - Inicio con color, distinto según el rol, con la actividad del taller en vivo
const usuario = iniciarPagina();
const contenido = document.getElementById("contenido");
const campo = id => document.getElementById(id);

const COLOR_ESTADO = { "PENDIENTE": "text-bg-warning", "EN PROCESO": "text-bg-info", "TERMINADO": "text-bg-success" };

// ---------- Saludo y reloj ----------
campo("nombre").textContent = usuario.nombre.split(" ")[0];
function reloj() {
  const ahora = new Date();
  const h = ahora.getHours();
  campo("saludo").textContent = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  campo("reloj").textContent = ahora.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
  campo("hoyTexto").textContent = ahora.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}
reloj();
setInterval(reloj, 10000);
contenido.innerHTML = cargando();

// ---------- Piezas ----------
function tarjeta(titulo, valor, icono, color, detalle = "") {
  return `
    <div class="col-6 col-lg-3">
      <div class="kpi kpi-${color}">
        <div class="kpi-titulo">${titulo}</div>
        <div class="kpi-valor">${valor}</div>
        ${detalle ? `<div class="kpi-detalle">${detalle}</div>` : ""}
        <i class="bi bi-${icono} kpi-icono"></i>
      </div>
    </div>`;
}

function tablaStockBajo(lista) {
  if (!lista.length) return '<p class="text-success mb-0"><i class="bi bi-check-circle"></i> Todo el inventario está bien.</p>';
  return `
    <div class="table-responsive"><table class="table table-sm align-middle mb-0">
      <thead><tr><th>Repuesto</th><th>Categoría</th><th class="text-end">Stock</th></tr></thead>
      <tbody>${lista.map(r => `
        <tr>
          <td>${esc(r.nombre)}</td>
          <td class="small text-secondary">${esc(r.categoria)}</td>
          <td class="text-end"><span class="badge text-bg-danger">${r.stock} / mín. ${r.stock_minimo}</span></td>
        </tr>`).join("")}
      </tbody>
    </table></div>`;
}

function panel(titulo, icono, cuerpo, extra = "") {
  return `
    <div class="card h-100"><div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h6 fw-bold mb-0"><i class="bi bi-${icono} text-taller"></i> ${titulo}</h2>${extra}
      </div>
      ${cuerpo}
    </div></div>`;
}

// ---------- ADMINISTRADOR ----------
async function inicioAdministrador() {
  campo("subtitulo").textContent = "Así va El Hospital hoy.";
  const [d, actividad] = await Promise.all([api("/dashboard"), api("/actividad?limite=30")]);
  contenido.innerHTML = `
    <div class="row g-3 mb-3">
      ${tarjeta("Ingresos de hoy", pesos(d.ingresos_hoy), "cash-coin", "rojo",
                `Repuestos ${pesos(d.ventas_hoy)} · Mano de obra ${pesos(d.mano_obra_hoy)}`)}
      ${tarjeta("Ingresos del mes", pesos(d.ingresos_mes), "graph-up-arrow", "verde",
                `Repuestos ${pesos(d.ventas_mes)} · Mano de obra ${pesos(d.mano_obra_mes)}`)}
      ${tarjeta("Mano de obra por cobrar", pesos(d.mano_obra_por_cobrar), "hourglass-split", "naranja", "Trabajos sin terminar")}
      ${tarjeta("Valor del inventario", pesos(d.valor_inventario), "box-seam", "azul", `${d.total_clientes} clientes`)}
    </div>
    <div class="row g-3 mb-4">
      ${tarjeta("Pendientes", d.trabajos_pendientes, "clock", "negro", "trabajos")}
      ${tarjeta("En proceso", d.trabajos_en_proceso, "gear-wide-connected", "morado", "trabajos")}
      ${tarjeta("Terminados", d.trabajos_terminados, "check2-circle", "verde", "trabajos")}
      ${tarjeta("Stock bajo", d.repuestos_stock_bajo, "exclamation-triangle", d.repuestos_stock_bajo ? "rojo" : "negro", "repuestos por pedir")}
    </div>
    <div class="row g-3">
      <div class="col-lg-7" id="actividad">
        <div class="card h-100"><div class="card-body p-0">
          <div class="d-flex justify-content-between align-items-center px-3 pt-3 pb-2 border-bottom">
            <h2 class="h6 fw-bold mb-0"><i class="bi bi-activity text-taller"></i> Actividad del taller</h2>
            <span class="en-vivo">En vivo</span>
          </div>
          <div class="lista-actividad">
            ${actividad.length ? actividad.map(itemActividad).join("")
              : '<p class="text-secondary p-3 mb-0">Todavía no hay actividad. Cuando alguien registre algo, aparece aquí.</p>'}
          </div>
        </div></div>
      </div>
      <div class="col-lg-5">
        ${panel("Repuestos por pedir", "exclamation-triangle", tablaStockBajo(d.lista_stock_bajo))}
      </div>
    </div>`;
}

// ---------- VENDEDORA ----------
async function inicioVendedor() {
  campo("subtitulo").textContent = "Ventas, inventario y trabajos del día.";
  const fechaHoy = new Date().toLocaleDateString("en-CA");
  const [ventasHoy, stockBajo, trabajos] = await Promise.all([
    api(`/ventas?desde=${fechaHoy}&hasta=${fechaHoy}`),
    api("/repuestos?solo_stock_bajo=true"),
    api("/trabajos"),
  ]);
  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0);
  const activos = trabajos.filter(t => t.estado !== "TERMINADO");

  const listaVentas = ventasHoy.length ? `
    <ul class="list-group list-group-flush">${ventasHoy.map(v => {
      const partes = v.items.map(i => `${esc(i.repuesto)} ×${i.cantidad}`);
      if (v.id_trabajo) partes.unshift(`<i class="bi bi-tools"></i> ${esc(v.trabajo)} (${esc(v.mecanico)})`);
      return `
        <li class="list-group-item px-0 d-flex justify-content-between gap-2">
          <span><span class="small text-secondary">${hora(v.fecha)}</span> · ${esc(v.cliente || "Mostrador")}
            ${v.placa ? `· <strong>${esc(v.placa)}</strong>` : ""}<br><span class="small">${partes.join(" + ")}</span></span>
          <strong class="text-nowrap">${pesos(v.total)}</strong>
        </li>`;
    }).join("")}</ul>`
    : '<p class="text-secondary mb-0">Todavía no hay ventas hoy.</p>';

  contenido.innerHTML = `
    <div class="row g-3 mb-4">
      ${tarjeta("Vendido hoy", pesos(totalHoy), "cash-coin", "rojo", `${ventasHoy.length} ventas`)}
      ${tarjeta("Trabajos activos", activos.length, "tools", "morado", "pendientes y en proceso")}
      ${tarjeta("Por terminar", pesos(activos.reduce((s, t) => s + t.costo, 0)), "hourglass-split", "naranja", "mano de obra")}
      ${tarjeta("Stock bajo", stockBajo.length, "exclamation-triangle", stockBajo.length ? "rojo" : "verde", "repuestos por pedir")}
    </div>
    <div class="row g-3">
      <div class="col-lg-7">
        ${panel("Ventas de hoy", "receipt", listaVentas,
          `<a href="pages/movimientos.html" class="btn btn-sm btn-taller"><i class="bi bi-cart-plus"></i> Nueva venta</a>`)}
      </div>
      <div class="col-lg-5">${panel("Repuestos por agotarse", "exclamation-triangle", tablaStockBajo(stockBajo))}</div>
    </div>`;
}

// ---------- MECÁNICO: solo sus trabajos, lo que lleva y lo que le falta ----------
async function inicioTrabajador() {
  campo("subtitulo").textContent = "Estos son los trabajos que tienes asignados.";
  const trabajos = await api("/trabajos");
  const terminados = trabajos.filter(t => t.estado === "TERMINADO");
  const activos = trabajos.filter(t => t.estado !== "TERMINADO");
  const suma = lista => lista.reduce((s, t) => s + t.costo, 0);
  const ordenados = [...activos, ...terminados];

  const tabla = ordenados.length ? `
    <div class="table-responsive"><table class="table table-sm align-middle mb-0">
      <thead><tr><th>Moto</th><th>Cliente</th><th>Trabajo</th><th class="text-end">Mano de obra</th><th>Estado</th></tr></thead>
      <tbody>${ordenados.map(t => `
        <tr class="${t.estado === "TERMINADO" ? "text-secondary" : ""}">
          <td class="text-nowrap"><strong>${esc(t.placa)}</strong>${t.apodo ? `<br><span class="small text-taller">${esc(t.apodo)}</span>` : ""}</td>
          <td>${esc(t.cliente)}</td>
          <td class="small">${esc(t.descripcion)}
            ${t.repuestos ? `<div class="text-secondary"><i class="bi bi-box-seam"></i> ${esc(t.repuestos)}</div>` : ""}</td>
          <td class="text-end fw-semibold">${pesos(t.costo)}</td>
          <td><span class="badge ${COLOR_ESTADO[t.estado]}">${t.estado}</span></td>
        </tr>`).join("")}
      </tbody>
    </table></div>` : '<p class="text-secondary mb-0">Todavía no tienes trabajos asignados.</p>';

  contenido.innerHTML = `
    <div class="row g-3 mb-4">
      ${tarjeta("Ya terminaste", pesos(suma(terminados)), "check2-circle", "verde", `${terminados.length} trabajos`)}
      ${tarjeta("Te falta", pesos(suma(activos)), "hourglass-split", "naranja", `${activos.length} trabajos`)}
      ${tarjeta("Pendientes", trabajos.filter(t => t.estado === "PENDIENTE").length, "clock", "negro")}
      ${tarjeta("En proceso", trabajos.filter(t => t.estado === "EN PROCESO").length, "gear-wide-connected", "morado")}
    </div>
    ${panel("Tus trabajos", "tools", tabla,
      `<a href="pages/trabajos.html" class="btn btn-sm btn-taller"><i class="bi bi-plus-lg"></i> Nueva orden</a>`)}`;
}

// ---------- Arrancar y mantener actualizado ----------
const inicios = { ADMINISTRADOR: inicioAdministrador, VENDEDOR: inicioVendedor, TRABAJADOR: inicioTrabajador };
function mostrarInicio() {
  inicios[usuario.rol]()
    .then(() => setTimeout(() => contenido.classList.add("sin-animacion"), 800))   // animar solo la primera vez
    .catch(error => mostrarMensaje("error", error.message));
}
mostrarInicio();
alActualizar(mostrarInicio);


