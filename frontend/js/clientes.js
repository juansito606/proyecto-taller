// clientes.js - Clientes y sus motos (relación 1 a muchos)
const usuario = iniciarPagina(["ADMINISTRADOR", "VENDEDOR"]);
const esAdmin = usuario.rol === "ADMINISTRADOR";

const tabla = document.getElementById("tabla");
const formCliente = document.getElementById("formCliente");
const formMoto = document.getElementById("formMoto");
const modalCliente = new bootstrap.Modal("#modalCliente");
const modalMotos = new bootstrap.Modal("#modalMotos");
const campo = id => document.getElementById(id);

let clientes = [];
let motos = [];
let editandoId = null;
let clienteMotos = null;   // cliente cuyas motos se están viendo

// ---------- Cargar clientes y motos ----------
async function cargar() {
  const buscar = campo("buscar").value.trim();
  tabla.innerHTML = `<tr><td colspan="6">${cargando()}</td></tr>`;
  try {
    [clientes, motos] = await Promise.all([
      api("/clientes" + (buscar ? "?buscar=" + encodeURIComponent(buscar) : "")),
      api("/motos"),
    ]);
    dibujarTabla();
  } catch (error) {
    tabla.innerHTML = `<tr><td colspan="6" class="text-danger">${esc(error.message)}</td></tr>`;
  }
}

const motosDe = idCliente => motos.filter(m => m.id_cliente === idCliente);

function dibujarTabla() {
  campo("contador").textContent = clientes.length;
  if (!clientes.length) {
    tabla.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">No se encontraron clientes.</td></tr>';
    return;
  }
  tabla.innerHTML = clientes.map(c => {
    const susMotos = motosDe(c.id_cliente);
    const etiquetas = susMotos.map(m =>
      `<span class="badge text-bg-dark me-1">${esc(m.placa)}${m.apodo ? " · " + esc(m.apodo) : ""}</span>`).join("");
    return `
      <tr>
        <td>${esc(c.documento)}</td>
        <td class="fw-semibold">${esc(c.nombre)}</td>
        <td>${esc(c.telefono)}</td>
        <td class="small">${esc(c.correo || "—")}</td>
        <td>${etiquetas || '<span class="text-secondary small">Sin motos</span>'}</td>
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-outline-dark" data-motos="${c.id_cliente}" title="Motos"><i class="bi bi-bicycle"></i></button>
          <button class="btn btn-sm btn-outline-secondary" data-editar="${c.id_cliente}" title="Editar"><i class="bi bi-pencil"></i></button>
          ${esAdmin ? `<button class="btn btn-sm btn-outline-danger" data-eliminar="${c.id_cliente}" title="Eliminar"><i class="bi bi-trash"></i></button>` : ""}
        </td>
      </tr>`;
  }).join("");
}

let espera;
campo("buscar").addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(cargar, 300); });

// ---------- Formulario de cliente ----------
function abrirCliente(cliente = null) {
  formCliente.reset();
  formCliente.classList.remove("was-validated");
  editandoId = cliente ? cliente.id_cliente : null;
  campo("tituloCliente").textContent = cliente ? "Editar cliente" : "Nuevo cliente";
  if (cliente) ["documento", "nombre", "telefono", "correo"].forEach(c => campo(c).value = cliente[c] || "");
  modalCliente.show();
}

campo("btnNuevo").addEventListener("click", () => abrirCliente());

formCliente.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!formCliente.checkValidity()) {
    formCliente.classList.add("was-validated");
    mostrarMensaje("advertencia", "Revise los campos marcados en rojo");
    return;
  }
  const datos = {
    documento: campo("documento").value.trim(),
    nombre: campo("nombre").value.trim(),
    telefono: campo("telefono").value.trim(),
    correo: campo("correo").value.trim() || null,
  };
  try {
    if (editandoId) {
      await api(`/clientes/${editandoId}`, { method: "PUT", body: JSON.stringify(datos) });
      mostrarMensaje("exito", "Cliente actualizado");
    } else {
      await api("/clientes", { method: "POST", body: JSON.stringify(datos) });
      mostrarMensaje("exito", "Cliente registrado");
    }
    modalCliente.hide();
    cargar();
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

// ---------- Botones de la tabla ----------
tabla.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("button");
  if (!boton) return;
  const id = Number(boton.dataset.motos || boton.dataset.editar || boton.dataset.eliminar);
  const cliente = clientes.find(c => c.id_cliente === id);

  if (boton.dataset.motos) abrirMotos(cliente);
  if (boton.dataset.editar) abrirCliente(cliente);
  if (boton.dataset.eliminar) {
    if (!await confirmar(`¿Eliminar a ${cliente.nombre}?`)) return;
    try {
      await api(`/clientes/${id}`, { method: "DELETE" });
      mostrarMensaje("exito", "Cliente eliminado");
      cargar();
    } catch (error) {
      mostrarMensaje("error", error.message);   // si tiene motos o compras, Oracle no lo deja
    }
  }
});

// ---------- Motos del cliente ----------
function abrirMotos(cliente) {
  clienteMotos = cliente;
  campo("duenoMotos").textContent = cliente.nombre;
  formMoto.reset();
  formMoto.classList.remove("was-validated");
  dibujarMotos();
  modalMotos.show();
}

function dibujarMotos() {
  const lista = motosDe(clienteMotos.id_cliente);
  campo("tablaMotos").innerHTML = lista.length ? lista.map(m => `
    <tr>
      <td><strong>${esc(m.placa)}</strong></td>
      <td>${esc(m.marca)} ${esc(m.modelo)}</td>
      <td>${m.anio || "—"}</td>
      <td>${m.apodo ? `<span class="text-taller fw-semibold">${esc(m.apodo)}</span>` : "—"}</td>
      <td class="text-end">${esAdmin ? `<button class="btn btn-sm btn-outline-danger" data-borrar-moto="${m.id_moto}"><i class="bi bi-trash"></i></button>` : ""}</td>
    </tr>`).join("") : '<tr><td colspan="5" class="text-secondary">Este cliente no tiene motos registradas.</td></tr>';
}

formMoto.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!formMoto.checkValidity()) {
    formMoto.classList.add("was-validated");
    return;
  }
  const datos = {
    placa: campo("placa").value.trim().toUpperCase(),
    marca: campo("marcaMoto").value.trim(),
    modelo: campo("modelo").value.trim(),
    anio: campo("anio").value ? Number(campo("anio").value) : null,
    apodo: campo("apodo").value.trim() || null,
    id_cliente: clienteMotos.id_cliente,
  };
  try {
    const nueva = await api("/motos", { method: "POST", body: JSON.stringify(datos) });
    motos.push(nueva);
    mostrarMensaje("exito", `Moto ${nueva.placa} agregada`);
    formMoto.reset();
    formMoto.classList.remove("was-validated");
    dibujarMotos();
    dibujarTabla();
  } catch (error) {
    mostrarMensaje("error", error.message);   // por ejemplo: placa repetida
  }
});

campo("tablaMotos").addEventListener("click", async (evento) => {
  const boton = evento.target.closest("[data-borrar-moto]");
  if (!boton) return;
  const id = Number(boton.dataset.borrarMoto);
  try {
    await api(`/motos/${id}`, { method: "DELETE" });
    motos = motos.filter(m => m.id_moto !== id);
    mostrarMensaje("exito", "Moto eliminada");
    dibujarMotos();
    dibujarTabla();
  } catch (error) {
    mostrarMensaje("error", error.message);   // si la moto tiene trabajos, Oracle no lo deja
  }
});

cargar();


