// trabajos.js - Trabajos del taller: cambia según el rol
const usuario = iniciarPagina();
const esAdmin = usuario.rol === "ADMINISTRADOR";
const esTrabajador = usuario.rol === "TRABAJADOR";
const puedeEditar = esAdmin || esTrabajador;   // el vendedor solo mira

const tabla = document.getElementById("tabla");
const form = document.getElementById("formTrabajo");
const modal = new bootstrap.Modal("#modalTrabajo");
const campo = id => document.getElementById(id);

let trabajos = [];
let editandoId = null;

const COLOR_ESTADO = { "PENDIENTE": "text-bg-warning", "EN PROCESO": "text-bg-info", "TERMINADO": "text-bg-success" };
const SIGUIENTE = { "PENDIENTE": "EN PROCESO", "EN PROCESO": "TERMINADO" };

if (puedeEditar) campo("btnNuevo").classList.remove("d-none");
if (esTrabajador) campo("subtitulo").innerHTML = 'Tus trabajos · <span id="contador">0</span>';

// ---------- Listas para los select ----------
async function cargarListas() {
  const motos = await api("/motos");
  campo("id_moto").innerHTML = '<option value="">Elija...</option>' + motos.map(m =>
    `<option value="${m.id_moto}">${esc(m.placa)} · ${esc(m.marca)} ${esc(m.modelo)}${m.apodo ? " (" + esc(m.apodo) + ")" : ""} — ${esc(m.cliente)}</option>`).join("");

  if (esAdmin) {
    const trabajadores = await api("/usuarios?id_rol=3");
    const activos = trabajadores.filter(t => t.activo === "S");
    llenarSelect(campo("filtroTrabajador"), trabajadores, "id_usuario", "nombre", "Todos los trabajadores");
    llenarSelect(campo("id_usuario"), activos, "id_usuario", "nombre", "Elija...");
    campo("cajaFiltroTrabajador").classList.remove("d-none");
    campo("cajaTrabajador").classList.remove("d-none");
    campo("id_usuario").required = true;
  }
}

// ---------- Listar con filtros ----------
async function cargar() {
  const filtros = new URLSearchParams();
  if (campo("buscar").value.trim()) filtros.set("buscar", campo("buscar").value.trim());
  if (campo("filtroEstado").value) filtros.set("estado", campo("filtroEstado").value);
  if (esAdmin && campo("filtroTrabajador").value) filtros.set("id_usuario", campo("filtroTrabajador").value);
  if (campo("desde").value) filtros.set("desde", campo("desde").value);
  if (campo("hasta").value) filtros.set("hasta", campo("hasta").value);

  tabla.innerHTML = `<tr><td colspan="8">${cargando()}</td></tr>`;
  try {
    trabajos = await api("/trabajos?" + filtros);
    dibujarTabla();
  } catch (error) {
    tabla.innerHTML = `<tr><td colspan="8" class="text-danger">${esc(error.message)}</td></tr>`;
  }
}

function dibujarTabla() {
  campo("contador").textContent = trabajos.length;
  if (!trabajos.length) {
    tabla.innerHTML = '<tr><td colspan="8" class="text-center text-secondary py-4">No hay trabajos con esos filtros.</td></tr>';
    return;
  }
  tabla.innerHTML = trabajos.map(t => `
    <tr>
      <td class="small text-nowrap">${fecha(t.fecha)}</td>
      <td class="text-nowrap"><strong>${esc(t.placa)}</strong>${t.apodo ? `<br><span class="small text-taller">${esc(t.apodo)}</span>` : ""}</td>
      <td>${esc(t.cliente)}</td>
      <td class="small">${esc(t.descripcion)}</td>
      <td class="small">${esc(t.trabajador)}</td>
      <td class="text-end">${pesos(t.costo)}</td>
      <td><span class="badge ${COLOR_ESTADO[t.estado]}">${t.estado}</span></td>
      <td class="text-end text-nowrap">
        ${puedeEditar && SIGUIENTE[t.estado] ? `<button class="btn btn-sm btn-outline-success" data-avanzar="${t.id_trabajo}" title="Pasar a ${SIGUIENTE[t.estado]}"><i class="bi bi-arrow-right-circle"></i></button>` : ""}
        ${puedeEditar ? `<button class="btn btn-sm btn-outline-secondary" data-editar="${t.id_trabajo}" title="Editar"><i class="bi bi-pencil"></i></button>` : ""}
        ${esAdmin ? `<button class="btn btn-sm btn-outline-danger" data-eliminar="${t.id_trabajo}" title="Eliminar"><i class="bi bi-trash"></i></button>` : ""}
      </td>
    </tr>`).join("");
}

let espera;
campo("buscar").addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(cargar, 300); });
["filtroEstado", "filtroTrabajador", "desde", "hasta"].forEach(id => campo(id).addEventListener("change", cargar));

// ---------- Formulario ----------
function abrirFormulario(trabajo = null) {
  form.reset();
  form.classList.remove("was-validated");
  editandoId = trabajo ? trabajo.id_trabajo : null;
  campo("tituloModal").textContent = trabajo ? "Editar trabajo" : "Nuevo trabajo";
  if (trabajo) {
    ["id_moto", "descripcion", "costo", "estado"].forEach(c => campo(c).value = trabajo[c]);
    if (esAdmin) campo("id_usuario").value = trabajo.id_usuario;
  } else {
    campo("costo").value = 0;
  }
  modal.show();
}

campo("btnNuevo").addEventListener("click", () => abrirFormulario());

async function guardar(id, datos) {
  if (id) return api(`/trabajos/${id}`, { method: "PUT", body: JSON.stringify(datos) });
  return api("/trabajos", { method: "POST", body: JSON.stringify(datos) });
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    mostrarMensaje("advertencia", "Revise los campos marcados en rojo");
    return;
  }
  const datos = {
    id_moto: Number(campo("id_moto").value),
    id_usuario: esAdmin ? Number(campo("id_usuario").value) : null,   // el trabajador: lo pone la API
    descripcion: campo("descripcion").value.trim(),
    costo: Number(campo("costo").value),
    estado: campo("estado").value,
  };
  try {
    await guardar(editandoId, datos);
    mostrarMensaje("exito", editandoId ? "Trabajo actualizado" : "Trabajo registrado");
    modal.hide();
    cargar();
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

// ---------- Botones de la tabla ----------
tabla.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("button");
  if (!boton) return;
  const id = Number(boton.dataset.avanzar || boton.dataset.editar || boton.dataset.eliminar);
  const trabajo = trabajos.find(t => t.id_trabajo === id);

  try {
    if (boton.dataset.avanzar) {
      const nuevo = SIGUIENTE[trabajo.estado];
      await guardar(id, { id_moto: trabajo.id_moto, id_usuario: trabajo.id_usuario, descripcion: trabajo.descripcion,
                          costo: trabajo.costo, estado: nuevo });
      mostrarMensaje("exito", `Trabajo de ${trabajo.placa} → ${nuevo}`);
      cargar();
    }
    if (boton.dataset.editar) abrirFormulario(trabajo);
    if (boton.dataset.eliminar) {
      if (!await confirmar(`¿Eliminar el trabajo de ${trabajo.placa}?`)) return;
      await api(`/trabajos/${id}`, { method: "DELETE" });
      mostrarMensaje("exito", "Trabajo eliminado");
      cargar();
    }
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

cargarListas().then(cargar).catch(error => mostrarMensaje("error", error.message));



