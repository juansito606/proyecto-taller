// movimientos.js - Ventas y compras: mueven el stock del inventario
const usuario = iniciarPagina(["ADMINISTRADOR", "VENDEDOR"]);
const esAdmin = usuario.rol === "ADMINISTRADOR";

const tabla = document.getElementById("tabla");
const form = document.getElementById("formMovimiento");
const modal = new bootstrap.Modal("#modalMovimiento");
const campo = id => document.getElementById(id);

let movimientos = [];
let repuestos = [];
let tipoActual = "VENTA";

// ---------- Listas para los select ----------
async function cargarListas() {
  const [listaRepuestos, clientes, trabajos] = await Promise.all([
    api("/repuestos"), api("/clientes"), api("/trabajos"),
  ]);
  repuestos = listaRepuestos;
  llenarSelect(campo("filtroRepuesto"), repuestos, "id_repuesto", "nombre", "Todos los repuestos");
  llenarSelect(campo("id_cliente"), clientes, "id_cliente", "nombre", "Venta de mostrador (sin cliente)");
  campo("id_trabajo").innerHTML = '<option value="">No</option>' + trabajos
    .filter(t => t.estado !== "TERMINADO")
    .map(t => `<option value="${t.id_trabajo}">${esc(t.placa)}${t.apodo ? " (" + esc(t.apodo) + ")" : ""} — ${esc(t.descripcion)}</option>`)
    .join("");
}

function llenarRepuestosFormulario() {
  campo("id_repuesto").innerHTML = '<option value="">Elija...</option>' + repuestos.map(r =>
    `<option value="${r.id_repuesto}">${esc(r.nombre)} — stock: ${r.stock}</option>`).join("");
}

// ---------- Listar con filtros ----------
async function cargar() {
  const filtros = new URLSearchParams();
  if (campo("filtroTipo").value) filtros.set("tipo", campo("filtroTipo").value);
  if (campo("filtroRepuesto").value) filtros.set("id_repuesto", campo("filtroRepuesto").value);
  if (campo("desde").value) filtros.set("desde", campo("desde").value);
  if (campo("hasta").value) filtros.set("hasta", campo("hasta").value);

  tabla.innerHTML = `<tr><td colspan="9">${cargando()}</td></tr>`;
  try {
    movimientos = await api("/movimientos?" + filtros);
    dibujarTabla();
  } catch (error) {
    tabla.innerHTML = `<tr><td colspan="9" class="text-danger">${esc(error.message)}</td></tr>`;
  }
}

function dibujarTabla() {
  const suma = tipo => movimientos.filter(m => m.tipo === tipo).reduce((s, m) => s + m.total, 0);
  const ventas = suma("VENTA"), compras = suma("COMPRA");
  campo("contador").textContent = movimientos.length;
  campo("totalVentas").textContent = pesos(ventas);
  campo("totalCompras").textContent = pesos(compras);
  campo("diferencia").textContent = pesos(ventas - compras);
  campo("diferencia").className = "fs-5 fw-bold " + (ventas - compras >= 0 ? "text-success" : "text-danger");

  if (!movimientos.length) {
    tabla.innerHTML = '<tr><td colspan="9" class="text-center text-secondary py-4">No hay movimientos con esos filtros.</td></tr>';
    return;
  }
  tabla.innerHTML = movimientos.map(m => `
    <tr>
      <td class="small text-nowrap">${fecha(m.fecha)}</td>
      <td><span class="badge ${m.tipo === "VENTA" ? "text-bg-success" : "text-bg-secondary"}">${m.tipo}</span></td>
      <td>${esc(m.repuesto)}</td>
      <td class="text-center">${m.cantidad}</td>
      <td class="text-end">${pesos(m.precio_unitario)}</td>
      <td class="text-end fw-semibold">${pesos(m.total)}</td>
      <td class="small">${esc(m.cliente || "—")}</td>
      <td class="small">${esc(m.usuario)}</td>
      <td class="text-end">${esAdmin ? `<button class="btn btn-sm btn-outline-danger" data-anular="${m.id_movimiento}" title="Anular"><i class="bi bi-x-circle"></i></button>` : ""}</td>
    </tr>`).join("");
}

["filtroTipo", "filtroRepuesto", "desde", "hasta"].forEach(id => campo(id).addEventListener("change", cargar));

// ---------- Formulario de venta o compra ----------
function abrirFormulario(tipo) {
  tipoActual = tipo;
  form.reset();
  form.classList.remove("was-validated");
  llenarRepuestosFormulario();
  const esVenta = tipo === "VENTA";

  campo("tituloModal").textContent = esVenta ? "Registrar venta" : "Registrar compra a proveedor";
  campo("cabeceraModal").className = "modal-header " + (esVenta ? "bg-success text-white" : "bg-dark text-white");
  campo("etiquetaPrecio").textContent = esVenta ? "Precio unitario (opcional)" : "Precio de compra *";
  campo("precio_unitario").required = !esVenta;
  document.querySelectorAll(".solo-venta").forEach(e => e.classList.toggle("d-none", !esVenta));
  campo("infoRepuesto").textContent = "";
  campo("totalFormulario").textContent = pesos(0);
  modal.show();
}

campo("btnVenta").addEventListener("click", () => abrirFormulario("VENTA"));
campo("btnCompra").addEventListener("click", () => abrirFormulario("COMPRA"));

const repuestoElegido = () => repuestos.find(r => r.id_repuesto == campo("id_repuesto").value);

// Muestra stock y precio, y recalcula el total mientras escribe
function actualizarFormulario() {
  const r = repuestoElegido();
  const cantidad = Number(campo("cantidad").value) || 0;
  campo("infoRepuesto").innerHTML = r
    ? `Disponible: <strong class="${r.stock_bajo ? "text-danger" : ""}">${r.stock} unidades</strong> · Precio de venta: <strong>${pesos(r.precio)}</strong>`
    : "";
  if (r && tipoActual === "VENTA" && !campo("precio_unitario").value) campo("precio_unitario").placeholder = r.precio;

  // Validación en el frontend: no vender más de lo que hay
  if (r && tipoActual === "VENTA" && cantidad > r.stock) {
    campo("cantidad").setCustomValidity("sin stock");
    campo("errorCantidad").textContent = `Solo hay ${r.stock} unidades.`;
  } else {
    campo("cantidad").setCustomValidity("");
    campo("errorCantidad").textContent = "Mínimo 1.";
  }

  const precio = Number(campo("precio_unitario").value) || (tipoActual === "VENTA" && r ? r.precio : 0);
  campo("totalFormulario").textContent = pesos(precio * cantidad);
}

["id_repuesto", "cantidad", "precio_unitario"].forEach(id => campo(id).addEventListener("input", actualizarFormulario));

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  actualizarFormulario();
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    mostrarMensaje("advertencia", "Revise los campos marcados en rojo");
    return;
  }

  const datos = {
    tipo: tipoActual,
    id_repuesto: Number(campo("id_repuesto").value),
    cantidad: Number(campo("cantidad").value),
    precio_unitario: campo("precio_unitario").value ? Number(campo("precio_unitario").value) : null,
    id_cliente: tipoActual === "VENTA" && campo("id_cliente").value ? Number(campo("id_cliente").value) : null,
    id_trabajo: tipoActual === "VENTA" && campo("id_trabajo").value ? Number(campo("id_trabajo").value) : null,
  };

  const boton = campo("btnGuardar");
  boton.disabled = true;
  try {
    const nuevo = await api("/movimientos", { method: "POST", body: JSON.stringify(datos) });
    mostrarMensaje("exito", `${nuevo.tipo === "VENTA" ? "Venta" : "Compra"} registrada: ${nuevo.repuesto} × ${nuevo.cantidad} = ${pesos(nuevo.total)}`);
    modal.hide();
    repuestos = await api("/repuestos");   // el stock cambió
    cargar();
  } catch (error) {
    mostrarMensaje("error", error.message);
  } finally {
    boton.disabled = false;
  }
});

// ---------- Anular (solo administrador) ----------
tabla.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("[data-anular]");
  if (!boton) return;
  const m = movimientos.find(x => x.id_movimiento == boton.dataset.anular);
  const efecto = m.tipo === "VENTA" ? `devolverá ${m.cantidad} al stock` : `quitará ${m.cantidad} del stock`;
  if (!await confirmar(`¿Anular esta ${m.tipo.toLowerCase()} de ${m.repuesto}? Se ${efecto}.`)) return;
  try {
    await api(`/movimientos/${m.id_movimiento}`, { method: "DELETE" });
    mostrarMensaje("exito", "Movimiento anulado y stock restablecido");
    repuestos = await api("/repuestos");
    cargar();
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

cargarListas().then(cargar).catch(error => mostrarMensaje("error", error.message));


