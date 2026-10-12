// dashboard.js - Pantalla de inicio: distinta según el rol
const usuario = iniciarPagina();
const contenido = document.getElementById("contenido");

document.getElementById("nombre").textContent = usuario.nombre.split(" ")[0];
contenido.innerHTML = cargando();

function tarjeta(titulo, valor, icono, alerta = false) {
  return `
    <div class="col-6 col-lg-3">
      <div class="card tarjeta-kpi shadow-sm h-100 ${alerta ? "alerta" : ""}">
        <div class="card-body d-flex align-items-center gap-3">
          <div class="icono"><i class="bi bi-${icono}"></i></div>
          <div>
            <div class="small text-secondary">${titulo}</div>
            <div class="fs-5 fw-bold">${valor}</div>
          </div>
        </div>
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
          <td>${esc(r.categoria)}</td>
          <td class="text-end"><span class="badge text-bg-danger">${r.stock} / mín. ${r.stock_minimo}</span></td>
        </tr>`).join("")}
      </tbody>
    </table></div>`;
}

// ---------- ADMINISTRADOR: dashboard completo ----------
async function inicioAdministrador() {
  document.getElementById("subtitulo").textContent = "Así va El Hospital hoy.";
  const d = await api("/dashboard");

  contenido.innerHTML = `
    <div class="row g-3 mb-3">
      ${tarjeta("Ventas de hoy", pesos(d.ventas_hoy), "cash-coin")}
      ${tarjeta("Ventas del mes", pesos(d.ventas_mes), "graph-up-arrow")}
      ${tarjeta("Valor del inventario", pesos(d.valor_inventario), "box-seam")}
      ${tarjeta("Repuestos con stock bajo", d.repuestos_stock_bajo, "exclamation-triangle", d.repuestos_stock_bajo > 0)}
    </div>
    <div class="row g-3 mb-4">
      ${tarjeta("Trabajos pendientes", d.trabajos_pendientes, "hourglass-split")}
      ${tarjeta("Trabajos en proceso", d.trabajos_en_proceso, "gear")}
      ${tarjeta("Trabajos terminados", d.trabajos_terminados, "check2-circle")}
      ${tarjeta("Clientes", d.total_clientes, "people")}
    </div>
    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card shadow-sm h-100"><div class="card-body">
          <h2 class="h6 fw-bold"><i class="bi bi-exclamation-triangle text-taller"></i> Repuestos por pedir</h2>
          ${tablaStockBajo(d.lista_stock_bajo)}
        </div></div>
      </div>
      <div class="col-lg-6">
        <div class="card shadow-sm h-100"><div class="card-body">
          <h2 class="h6 fw-bold"><i class="bi bi-clock-history text-taller"></i> Últimos movimientos</h2>
          <div class="table-responsive"><table class="table table-sm align-middle mb-0">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Repuesto</th><th class="text-end">Total</th></tr></thead>
            <tbody>${d.ultimos_movimientos.map(m => `
              <tr>
                <td class="small">${fecha(m.fecha)}</td>
                <td><span class="badge ${m.tipo === "VENTA" ? "text-bg-success" : "text-bg-secondary"}">${m.tipo}</span></td>
                <td class="small">${esc(m.repuesto)} × ${m.cantidad}</td>
                <td class="text-end">${pesos(m.total)}</td>
              </tr>`).join("")}
            </tbody>
          </table></div>
        </div></div>
      </div>
    </div>`;
}

// ---------- VENDEDOR: lo que necesita para vender ----------
async function inicioVendedor() {
  document.getElementById("subtitulo").textContent = "Revisa qué repuestos se están agotando.";
  const stockBajo = await api("/repuestos?solo_stock_bajo=true");
  contenido.innerHTML = `
    <div class="row g-3 mb-4">
      ${tarjeta("Repuestos con stock bajo", stockBajo.length, "exclamation-triangle", stockBajo.length > 0)}
    </div>
    <div class="card shadow-sm"><div class="card-body">
      <h2 class="h6 fw-bold"><i class="bi bi-exclamation-triangle text-taller"></i> Repuestos por agotarse</h2>
      ${tablaStockBajo(stockBajo)}
    </div></div>`;
}

// ---------- TRABAJADOR: sus trabajos ----------
async function inicioTrabajador() {
  document.getElementById("subtitulo").textContent = "Estos son tus trabajos.";
  const trabajos = await api("/trabajos");
  const contar = estado => trabajos.filter(t => t.estado === estado).length;
  const activos = trabajos.filter(t => t.estado !== "TERMINADO");

  contenido.innerHTML = `
    <div class="row g-3 mb-4">
      ${tarjeta("Pendientes", contar("PENDIENTE"), "hourglass-split")}
      ${tarjeta("En proceso", contar("EN PROCESO"), "gear")}
      ${tarjeta("Terminados", contar("TERMINADO"), "check2-circle")}
    </div>
    <div class="card shadow-sm"><div class="card-body">
      <h2 class="h6 fw-bold"><i class="bi bi-tools text-taller"></i> Trabajos por hacer</h2>
      ${activos.length ? `
        <div class="table-responsive"><table class="table table-sm align-middle mb-0">
          <thead><tr><th>Moto</th><th>Cliente</th><th>Trabajo</th><th>Estado</th></tr></thead>
          <tbody>${activos.map(t => `
            <tr>
              <td><strong>${esc(t.placa)}</strong> ${t.apodo ? `<span class="text-taller">(${esc(t.apodo)})</span>` : ""}</td>
              <td>${esc(t.cliente)}</td>
              <td class="small">${esc(t.descripcion)}</td>
              <td><span class="badge ${t.estado === "PENDIENTE" ? "text-bg-warning" : "text-bg-info"}">${t.estado}</span></td>
            </tr>`).join("")}
          </tbody>
        </table></div>` : '<p class="text-success mb-0"><i class="bi bi-check-circle"></i> ¡No tienes trabajos pendientes!</p>'}
    </div></div>`;
}

// ---------- Elegir según el rol ----------
const inicios = { ADMINISTRADOR: inicioAdministrador, VENDEDOR: inicioVendedor, TRABAJADOR: inicioTrabajador };
inicios[usuario.rol]().catch(error => {
  contenido.innerHTML = `<div class="alert alert-danger">${esc(error.message)}</div>`;
  mostrarMensaje("error", error.message);
});



