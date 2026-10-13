// reportes.js - Consultas consolidadas (solo administrador) - se actualizan solas
iniciarPagina(["ADMINISTRADOR"]);
const campo = id => document.getElementById(id);

campo("fechaReporte").textContent = new Date().toLocaleDateString("es-CO", { dateStyle: "long" });

function barra(valor, maximo) {
  const porcentaje = maximo ? Math.round((valor / maximo) * 100) : 0;
  return `<div class="progress barra-dato"><div class="progress-bar" style="width:${porcentaje}%"></div></div>`;
}

function nombreMes(texto) {
  return new Date(texto + "-01T00:00:00").toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

function caja(titulo, valor, color = "", esDinero = true) {
  return `
    <div class="col-6 col-md-3">
      <div class="small text-secondary">${titulo}</div>
      <div class="fs-5 fw-bold ${color}">${esDinero ? pesos(valor) : valor}</div>
    </div>`;
}

// ---------- HOY EN EL TALLER ----------
async function cargarHoy() {
  const fechaHoy = new Date().toLocaleDateString("en-CA");   // "2026-10-12"
  try {
    const [ventasHoy, terminados] = await Promise.all([
      api(`/ventas?desde=${fechaHoy}&hasta=${fechaHoy}`),
      api("/trabajos?estado=TERMINADO"),
    ]);
    const terminadosHoy = terminados.filter(t => (t.fecha_terminado || "").startsWith(fechaHoy));
    const repuestosHoy = ventasHoy.reduce((s, v) => s + v.total_repuestos, 0);
    const manoObraHoy = terminadosHoy.reduce((s, t) => s + t.costo, 0);

    campo("hoyResumen").innerHTML =
      caja("Ventas registradas", ventasHoy.length, "", false) +
      caja("Repuestos vendidos", repuestosHoy, "text-success") +
      caja("Mano de obra terminada", manoObraHoy, "text-success") +
      caja("Total del día", repuestosHoy + manoObraHoy, "text-success");

    campo("hoyVentas").innerHTML = ventasHoy.length ? ventasHoy.map(v => {
      const partes = v.items.map(i => `${esc(i.repuesto)} ×${i.cantidad}`);
      if (v.id_trabajo) partes.unshift(`<i class="bi bi-tools"></i> ${esc(v.trabajo)} (${esc(v.mecanico)})`);
      const moto = v.placa ? ` · <strong>${esc(v.placa)}</strong>${v.apodo ? ` <span class="text-taller">${esc(v.apodo)}</span>` : ""}` : "";
      return `
        <li class="list-group-item px-0 d-flex justify-content-between gap-2">
          <span><span class="text-secondary small">${hora(v.fecha)}</span> · ${esc(v.cliente || "Mostrador")}${moto}
            <br><span class="small">${partes.join(" + ")}</span></span>
          <strong class="text-nowrap">${pesos(v.total)}</strong>
        </li>`;
    }).join("") : '<li class="list-group-item px-0 text-secondary">Todavía no hay ventas hoy.</li>';

    campo("hoyTerminados").innerHTML = terminadosHoy.length ? terminadosHoy.map(t => `
      <li class="list-group-item px-0 d-flex justify-content-between gap-2">
        <span><i class="bi bi-check2-circle text-success"></i> <strong>${esc(t.placa)}</strong>${t.apodo ? ` <span class="text-taller">${esc(t.apodo)}</span>` : ""}
          · ${esc(t.trabajador)}<br><span class="small">${esc(t.descripcion)}</span></span>
        <strong class="text-nowrap">${pesos(t.costo)}</strong>
      </li>`).join("") : '<li class="list-group-item px-0 text-secondary">Ningún trabajo terminado hoy.</li>';

    campo("actualizado").textContent = new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", second: "2-digit" });
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
}

// ---------- FLUJO DE CAJA ----------
async function cargarFlujo() {
  const filtros = new URLSearchParams();
  if (campo("desde").value) filtros.set("desde", campo("desde").value);
  if (campo("hasta").value) filtros.set("hasta", campo("hasta").value);
  try {
    const f = await api("/reportes/flujo-caja?" + filtros);
    campo("flujo").innerHTML =
      caja("Ventas de repuestos", f.ingresos_ventas, "text-success") +
      caja("Mano de obra (terminados)", f.ingresos_trabajos, "text-success") +
      caja("Compras a proveedores", f.egresos_compras, "text-danger") +
      caja("Balance", f.balance, f.balance >= 0 ? "text-success" : "text-danger");
  } catch (error) {
    campo("flujo").innerHTML = `<div class="text-danger">${esc(error.message)}</div>`;
  }
}
["desde", "hasta"].forEach(id => campo(id).addEventListener("change", cargarFlujo));

// ---------- OTROS REPORTES ----------
async function cargarReportes() {
  try {
    const [porMes, vendidos, trabajadores] = await Promise.all([
      api("/reportes/ventas-por-mes"),
      api("/reportes/repuestos-mas-vendidos?limite=10"),
      api("/reportes/trabajos-por-trabajador"),
    ]);

    const maxMes = Math.max(0, ...porMes.map(m => m.total_vendido));
    campo("ventasMes").innerHTML = porMes.length ? porMes.map(m => `
      <div class="mb-2">
        <div class="d-flex justify-content-between small">
          <span class="text-capitalize">${nombreMes(m.mes)} · ${m.cantidad_ventas} ventas</span>
          <strong>${pesos(m.total_vendido)}</strong>
        </div>
        ${barra(m.total_vendido, maxMes)}
      </div>`).join("") : '<p class="text-secondary mb-0">Aún no hay ventas.</p>';

    const maxUnidades = Math.max(0, ...vendidos.map(v => v.unidades_vendidas));
    campo("masVendidos").innerHTML = vendidos.length ? vendidos.map((v, i) => `
      <div class="mb-2">
        <div class="d-flex justify-content-between small">
          <span>${i + 1}. ${esc(v.repuesto)}</span>
          <span><strong>${v.unidades_vendidas}</strong> und · ${pesos(v.total_vendido)}</span>
        </div>
        ${barra(v.unidades_vendidas, maxUnidades)}
      </div>`).join("") : '<p class="text-secondary mb-0">Aún no hay ventas.</p>';

    campo("porTrabajador").innerHTML = `
      <div class="table-responsive"><table class="table table-sm align-middle mb-0">
        <thead><tr><th>Mecánico</th><th class="text-center">Trabajos</th><th class="text-center">Terminados</th>
                   <th class="text-end">Mano de obra cobrada</th><th class="text-end">Por cobrar</th></tr></thead>
        <tbody>${trabajadores.map(t => `
          <tr>
            <td class="fw-semibold">${esc(t.trabajador)}</td>
            <td class="text-center">${t.trabajos}</td>
            <td class="text-center">${t.terminados}</td>
            <td class="text-end text-success">${pesos(t.total_cobrado)}</td>
            <td class="text-end text-warning">${pesos(t.por_cobrar)}</td>
          </tr>`).join("")}
        </tbody>
      </table></div>`;
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
}

function cargarTodo() {
  cargarHoy();
  cargarFlujo();
  cargarReportes();
}
cargarTodo();
alActualizar(cargarTodo);


