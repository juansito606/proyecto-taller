// reportes.js - Consultas consolidadas (solo administrador)
iniciarPagina(["ADMINISTRADOR"]);
const campo = id => document.getElementById(id);

campo("fechaReporte").textContent = new Date().toLocaleDateString("es-CO", { dateStyle: "long" });

// Barrita roja proporcional al valor más alto
function barra(valor, maximo) {
  const porcentaje = maximo ? Math.round((valor / maximo) * 100) : 0;
  return `<div class="progress barra-dato"><div class="progress-bar" style="width:${porcentaje}%"></div></div>`;
}

function nombreMes(texto) {   // "2026-10" → "octubre de 2026"
  return new Date(texto + "-01T00:00:00").toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

// ---------- Flujo de caja (con filtro de fechas) ----------
async function cargarFlujo() {
  const filtros = new URLSearchParams();
  if (campo("desde").value) filtros.set("desde", campo("desde").value);
  if (campo("hasta").value) filtros.set("hasta", campo("hasta").value);
  campo("flujo").innerHTML = cargando();
  try {
    const f = await api("/reportes/flujo-caja?" + filtros);
    const caja = (titulo, valor, color) => `
      <div class="col-6 col-md-3">
        <div class="small text-secondary">${titulo}</div>
        <div class="fs-5 fw-bold ${color}">${pesos(valor)}</div>
      </div>`;
    campo("flujo").innerHTML =
      caja("Ventas de repuestos", f.ingresos_ventas, "text-success") +
      caja("Mano de obra (trabajos)", f.ingresos_trabajos, "text-success") +
      caja("Compras a proveedores", f.egresos_compras, "text-danger") +
      caja("Balance", f.balance, f.balance >= 0 ? "text-success" : "text-danger");
  } catch (error) {
    campo("flujo").innerHTML = `<div class="text-danger">${esc(error.message)}</div>`;
  }
}

["desde", "hasta"].forEach(id => campo(id).addEventListener("change", cargarFlujo));

// ---------- Los otros tres reportes ----------
async function cargarReportes() {
  ["ventasMes", "masVendidos", "porTrabajador"].forEach(id => campo(id).innerHTML = cargando());
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
        <thead><tr><th>Trabajador</th><th class="text-center">Trabajos</th><th class="text-center">Terminados</th><th class="text-end">Mano de obra cobrada</th></tr></thead>
        <tbody>${trabajadores.map(t => `
          <tr>
            <td class="fw-semibold">${esc(t.trabajador)}</td>
            <td class="text-center">${t.trabajos}</td>
            <td class="text-center">${t.terminados}</td>
            <td class="text-end">${pesos(t.total_cobrado)}</td>
          </tr>`).join("")}
        </tbody>
      </table></div>`;
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
}

cargarFlujo();
cargarReportes();


