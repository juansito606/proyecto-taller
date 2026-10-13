// movimientos.js - Ventas (repuestos + mano de obra en UN registro) y compras a proveedores
const usuario = iniciarPagina(["ADMINISTRADOR", "VENDEDOR"]);
const esAdmin = usuario.rol === "ADMINISTRADOR";
const campo = id => document.getElementById(id);

const formVenta = campo("formVenta");
const formCompra = campo("formCompra");
const modalVenta = new bootstrap.Modal("#modalVenta");
const modalCompra = new bootstrap.Modal("#modalCompra");

const COLOR_ESTADO = { "PENDIENTE": "text-bg-warning", "EN PROCESO": "text-bg-info", "TERMINADO": "text-bg-success" };

let ventas = [], compras = [];
let repuestos = [], clientes = [], motos = [], mecanicos = [];

const hoy = () => new Date().toLocaleDateString("en-CA");   // "2026-10-12" en hora de Colombia

// ---------- Listas para los formularios ----------
async function cargarListas() {
  [repuestos, clientes, motos, mecanicos] = await Promise.all([
    api("/repuestos"), api("/clientes"), api("/motos"), api("/usuarios/mecanicos"),
  ]);
  llenarSelect(campo("v_cliente"), clientes, "id_cliente", "nombre", "Venta de mostrador (sin cliente)");
  llenarSelect(campo("t_mecanico"), mecanicos, "id_usuario", "nombre", "¿Quién la trabaja?");
}

// ---------- Cargar ventas y compras ----------
async function cargar() {
  const fechas = new URLSearchParams();
  if (campo("desde").value) fechas.set("desde", campo("desde").value);
  if (campo("hasta").value) fechas.set("hasta", campo("hasta").value);
  const filtrosVentas = new URLSearchParams(fechas);
  if (campo("buscar").value.trim()) filtrosVentas.set("buscar", campo("buscar").value.trim());
  fechas.set("tipo", "COMPRA");
  try {
    [ventas, compras] = await Promise.all([api("/ventas?" + filtrosVentas), api("/movimientos?" + fechas)]);
    dibujarResumen();
    dibujarVentas();
    dibujarCompras();
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
}

function kpi(titulo, valor, icono, color = "") {
  return `
    <div class="col-6 col-lg-3"><div class="card tarjeta-kpi shadow-sm h-100"><div class="card-body d-flex align-items-center gap-3">
      <div class="icono"><i class="bi bi-${icono}"></i></div>
      <div><div class="small text-secondary">${titulo}</div><div class="fs-5 fw-bold ${color}">${pesos(valor)}</div></div>
    </div></div></div>`;
}

function dibujarResumen() {
  const rep = ventas.reduce((s, v) => s + v.total_repuestos, 0);
  const mano = ventas.reduce((s, v) => s + v.mano_obra, 0);
  const comp = compras.reduce((s, c) => s + c.total, 0);
  campo("resumen").innerHTML =
    kpi("Repuestos vendidos", rep, "box-seam") +
    kpi("Mano de obra", mano, "tools") +
    kpi("Total ventas", rep + mano, "cash-coin", "text-success") +
    kpi("Compras", comp, "truck", "text-danger");
}

function tarjetaVenta(v) {
  const tieneTrabajo = !!v.id_trabajo;
  const tieneItems = v.items.length > 0;
  const [tipoTexto, tipoColor] = tieneTrabajo && tieneItems ? ["Repuestos + mano de obra", "bg-taller"]
    : tieneTrabajo ? ["Solo mano de obra", "text-bg-info"] : ["Solo repuestos", "text-bg-success"];

  const moto = v.placa ? `
    <div class="small mb-2"><i class="bi bi-bicycle text-taller"></i> <strong>${esc(v.placa)}</strong>
      ${v.apodo ? `<span class="text-taller fw-semibold">${esc(v.apodo)}</span>` : ""} · ${esc(v.marca_moto)} ${esc(v.modelo_moto)}</div>` : "";

  const lineaMano = tieneTrabajo ? `
    <div class="linea">
      <span><i class="bi bi-tools text-secondary"></i> Mano de obra: ${esc(v.trabajo)}
        <span class="text-secondary">· ${esc(v.mecanico)}</span>
        <span class="badge ${COLOR_ESTADO[v.estado_trabajo]}">${v.estado_trabajo}</span></span>
      <span class="text-nowrap">${pesos(v.mano_obra)}</span>
    </div>` : "";

  const lineasRep = v.items.map(i => `
    <div class="linea">
      <span><i class="bi bi-box-seam text-secondary"></i> ${esc(i.repuesto)} × ${i.cantidad}</span>
      <span class="text-nowrap">${pesos(i.subtotal)}</span>
    </div>`).join("");

  return `
    <div class="col-lg-6"><div class="card venta-card shadow-sm h-100"><div class="card-body d-flex flex-column">
      <div class="d-flex justify-content-between align-items-start mb-1">
        <div>
          <div class="fw-bold">${v.cliente ? esc(v.cliente) : "Venta de mostrador"}</div>
          <div class="small text-secondary">#${v.id_venta} · ${fechaHora(v.fecha)} · registró ${esc(v.registro)}</div>
        </div>
        <div class="text-end text-nowrap">
          <span class="badge ${tipoColor}">${tipoTexto}</span>
          ${esAdmin ? `<button class="btn btn-sm btn-link text-danger p-0 ms-1" data-anular-venta="${v.id_venta}" title="Anular venta"><i class="bi bi-x-circle"></i></button>` : ""}
        </div>
      </div>
      ${moto}
      <div class="flex-grow-1">${lineaMano}${lineasRep}</div>
      <hr class="my-2">
      <div class="d-flex justify-content-between align-items-end">
        <div class="small text-secondary">Repuestos ${pesos(v.total_repuestos)}<br>Mano de obra ${pesos(v.mano_obra)}</div>
        <div class="fs-5 fw-bold">${pesos(v.total)}</div>
      </div>
    </div></div></div>`;
}

function dibujarVentas() {
  campo("nVentas").textContent = ventas.length;
  campo("listaVentas").innerHTML = ventas.length ? ventas.map(tarjetaVenta).join("")
    : '<div class="col-12 text-center text-secondary py-5">No hay ventas con esos filtros.</div>';
}

function dibujarCompras() {
  campo("nCompras").textContent = compras.length;
  campo("tablaCompras").innerHTML = compras.length ? compras.map(c => `
    <tr>
      <td class="small text-nowrap">${fechaHora(c.fecha)}</td>
      <td>${esc(c.repuesto)}</td>
      <td class="text-center">${c.cantidad}</td>
      <td class="text-end">${pesos(c.precio_unitario)}</td>
      <td class="text-end fw-semibold">${pesos(c.total)}</td>
      <td class="small">${esc(c.usuario)}</td>
      <td class="text-end">${esAdmin ? `<button class="btn btn-sm btn-outline-danger" data-anular-compra="${c.id_movimiento}" title="Anular"><i class="bi bi-x-circle"></i></button>` : ""}</td>
    </tr>`).join("")
    : '<tr><td colspan="7" class="text-center text-secondary py-4">No hay compras con esos filtros.</td></tr>';
}

// ---------- Filtros ----------
let espera;
campo("buscar").addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(cargar, 300); });
["desde", "hasta"].forEach(id => campo(id).addEventListener("change", cargar));
campo("btnHoy").addEventListener("click", () => {
  campo("desde").value = hoy();
  campo("hasta").value = hoy();
  cargar();
});

// ---------- NUEVA VENTA / SERVICIO ----------
function abrirVenta() {
  formVenta.reset();
  formVenta.classList.remove("was-validated");
  campo("itemsVenta").innerHTML = "";
  actualizarMotos();
  alternarTrabajo();
  modalVenta.show();
}
campo("btnVenta").addEventListener("click", abrirVenta);

// Al escoger el cliente, se muestran solo sus motos
function actualizarMotos() {
  const idCliente = Number(campo("v_cliente").value);
  const suyas = motos.filter(m => m.id_cliente === idCliente);
  campo("v_moto").innerHTML = `<option value="">${idCliente ? "Sin moto" : "Elija primero el cliente"}</option>` +
    suyas.map(m => `<option value="${m.id_moto}">${esc(m.placa)} · ${esc(m.marca)} ${esc(m.modelo)}${m.apodo ? " (" + esc(m.apodo) + ")" : ""}</option>`).join("");
  campo("v_moto").disabled = !idCliente;
  if (suyas.length === 1) campo("v_moto").value = suyas[0].id_moto;
}
campo("v_cliente").addEventListener("change", actualizarMotos);

// Mostrar u ocultar la parte de mano de obra
function alternarTrabajo() {
  const con = campo("v_conTrabajo").checked;
  campo("cajaTrabajo").classList.toggle("d-none", !con);
  ["t_descripcion", "t_mecanico", "t_costo"].forEach(id => campo(id).required = con);
  campo("v_moto").required = con;
  recalcular();
}
campo("v_conTrabajo").addEventListener("change", alternarTrabajo);

// Agregar una fila de repuesto
function agregarItem() {
  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td>
      <select class="form-select form-select-sm item-repuesto" required>
        <option value="">Elija...</option>
        ${repuestos.map(r => `<option value="${r.id_repuesto}" ${r.stock === 0 ? "disabled" : ""}>${esc(r.nombre)} (stock ${r.stock})</option>`).join("")}
      </select>
    </td>
    <td><input type="number" class="form-control form-control-sm item-cantidad" value="1" min="1" required></td>
    <td><input type="number" class="form-control form-control-sm item-precio" min="1" required></td>
    <td class="text-end item-subtotal text-nowrap">$ 0</td>
    <td><button type="button" class="btn btn-sm btn-outline-danger item-quitar"><i class="bi bi-x"></i></button></td>`;
  campo("itemsVenta").appendChild(fila);
  recalcular();
}
campo("btnAgregarItem").addEventListener("click", agregarItem);

const filasItems = () => [...campo("itemsVenta").querySelectorAll("tr")];

campo("itemsVenta").addEventListener("input", e => {
  if (e.target.classList.contains("item-repuesto")) {
    const r = repuestos.find(x => x.id_repuesto == e.target.value);
    e.target.closest("tr").querySelector(".item-precio").value = r ? r.precio : "";
  }
  recalcular();
});
campo("itemsVenta").addEventListener("click", e => {
  if (e.target.closest(".item-quitar")) {
    e.target.closest("tr").remove();
    recalcular();
  }
});
campo("t_costo").addEventListener("input", recalcular);

// Totales + validación de stock (también si se repite el mismo repuesto)
function recalcular() {
  const usados = {};
  let totalRep = 0;
  filasItems().forEach(fila => {
    const r = repuestos.find(x => x.id_repuesto == fila.querySelector(".item-repuesto").value);
    const inputCantidad = fila.querySelector(".item-cantidad");
    const cantidad = Number(inputCantidad.value) || 0;
    const precio = Number(fila.querySelector(".item-precio").value) || 0;
    if (r) usados[r.id_repuesto] = (usados[r.id_repuesto] || 0) + cantidad;
    const excede = r && usados[r.id_repuesto] > r.stock;
    inputCantidad.setCustomValidity(excede ? "sin stock" : "");
    inputCantidad.title = excede ? `Solo hay ${r.stock}` : "";
    totalRep += precio * cantidad;
    fila.querySelector(".item-subtotal").textContent = pesos(precio * cantidad);
  });
  const mano = campo("v_conTrabajo").checked ? Number(campo("t_costo").value) || 0 : 0;
  campo("sumRepuestos").textContent = pesos(totalRep);
  campo("sumMano").textContent = pesos(mano);
  campo("sumTotal").textContent = pesos(totalRep + mano);
  campo("sinItems").classList.toggle("d-none", filasItems().length > 0);
}

formVenta.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  recalcular();
  const conTrabajo = campo("v_conTrabajo").checked;

  if (!conTrabajo && !filasItems().length) {
    mostrarMensaje("advertencia", "Agregue al menos un repuesto o active la mano de obra");
    return;
  }
  if (conTrabajo && !campo("v_moto").value) {
    mostrarMensaje("advertencia", "Para la mano de obra elija el cliente y su moto");
    return;
  }
  if (!formVenta.checkValidity()) {
    formVenta.classList.add("was-validated");
    mostrarMensaje("advertencia", "Revise los campos en rojo (¿hay stock suficiente?)");
    return;
  }

  const datos = {
    id_cliente: campo("v_cliente").value ? Number(campo("v_cliente").value) : null,
    id_moto: campo("v_moto").value ? Number(campo("v_moto").value) : null,
    trabajo: conTrabajo ? {
      descripcion: campo("t_descripcion").value.trim(),
      id_usuario: Number(campo("t_mecanico").value),
      costo: Number(campo("t_costo").value),
      estado: campo("t_estado").value,
    } : null,
    items: filasItems().map(f => ({
      id_repuesto: Number(f.querySelector(".item-repuesto").value),
      cantidad: Number(f.querySelector(".item-cantidad").value),
      precio_unitario: Number(f.querySelector(".item-precio").value),
    })),
  };

  const boton = campo("btnGuardarVenta");
  boton.disabled = true;
  try {
    const venta = await api("/ventas", { method: "POST", body: JSON.stringify(datos) });
    mostrarMensaje("exito", `Venta #${venta.id_venta} registrada por ${pesos(venta.total)}`);
    modalVenta.hide();
    repuestos = await api("/repuestos");   // el stock cambió
    cargar();
  } catch (error) {
    mostrarMensaje("error", error.message);
  } finally {
    boton.disabled = false;
  }
});

// ---------- COMPRA A PROVEEDOR ----------
campo("btnCompra").addEventListener("click", () => {
  formCompra.reset();
  formCompra.classList.remove("was-validated");
  llenarSelect(campo("c_repuesto"), repuestos, "id_repuesto", "nombre", "Elija...");
  campo("c_total").textContent = pesos(0);
  modalCompra.show();
});
["c_cantidad", "c_precio"].forEach(id => campo(id).addEventListener("input", () => {
  campo("c_total").textContent = pesos((Number(campo("c_cantidad").value) || 0) * (Number(campo("c_precio").value) || 0));
}));
formCompra.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!formCompra.checkValidity()) {
    formCompra.classList.add("was-validated");
    return;
  }
  try {
    const compra = await api("/movimientos", { method: "POST", body: JSON.stringify({
      tipo: "COMPRA",
      id_repuesto: Number(campo("c_repuesto").value),
      cantidad: Number(campo("c_cantidad").value),
      precio_unitario: Number(campo("c_precio").value),
    }) });
    mostrarMensaje("exito", `Compra registrada: ${compra.repuesto} × ${compra.cantidad}`);
    modalCompra.hide();
    repuestos = await api("/repuestos");
    cargar();
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

// ---------- Anular (solo administrador) ----------
document.addEventListener("click", async (evento) => {
  const botonVenta = evento.target.closest("[data-anular-venta]");
  const botonCompra = evento.target.closest("[data-anular-compra]");
  if (!botonVenta && !botonCompra) return;
  try {
    if (botonVenta) {
      if (!await confirmar("¿Anular esta venta completa? Los repuestos vuelven al inventario y se borra su trabajo.")) return;
      await api(`/ventas/${botonVenta.dataset.anularVenta}`, { method: "DELETE" });
      mostrarMensaje("exito", "Venta anulada");
    } else {
      if (!await confirmar("¿Anular esta compra? Esas unidades salen del inventario.")) return;
      await api(`/movimientos/${botonCompra.dataset.anularCompra}`, { method: "DELETE" });
      mostrarMensaje("exito", "Compra anulada");
    }
    repuestos = await api("/repuestos");
    cargar();
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

// ---------- Arrancar y mantener actualizado ----------
campo("listaVentas").innerHTML = cargando();
cargarListas().then(cargar).catch(error => mostrarMensaje("error", error.message));
alActualizar(cargar);


