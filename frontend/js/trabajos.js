// trabajos.js - Admin y vendedora asignan; cada mecánico ve y avanza SOLO sus trabajos
const usuario = iniciarPagina();
const esAdmin = usuario.rol === "ADMINISTRADOR";
const esTrabajador = usuario.rol === "TRABAJADOR";
const puedeAsignar = !esTrabajador;   // admin y vendedora eligen el mecánico

const tabla = document.getElementById("tabla");
const form = document.getElementById("formTrabajo");
const modal = new bootstrap.Modal("#modalTrabajo");
const campo = id => document.getElementById(id);

let trabajos = [];
let editandoId = null;

const COLOR_ESTADO = { "PENDIENTE": "text-bg-warning", "EN PROCESO": "text-bg-info", "TERMINADO": "text-bg-success" };
const SIGUIENTE = { "PENDIENTE": "EN PROCESO", "EN PROCESO": "TERMINADO" };

campo("btnNuevo").classList.remove("d-none");
if (esTrabajador) campo("subtitulo").innerHTML = 'Tus trabajos asignados · <span id="contador">0</span>';

async function cargarListas() {
  const motos = await api("/motos");
  campo("id_moto").innerHTML = '<option value="">Elija...</option>' + motos.map(m =>
    `<option value="${m.id_moto}">${esc(m.placa)} · ${esc(m.marca)} ${esc(m.modelo)}${m.apodo ? " (" + esc(m.apodo) + ")" : ""} — ${esc(m.cliente)}</option>`).join("");

  if (puedeAsignar) {
    const mecanicos = await api("/usuarios/mecanicos");
    llenarSelect(campo("filtroTrabajador"), mecanicos, "id_usuario", "nombre", "Todos los mecánicos");
    llenarSelect(campo("id_usuario"), mecanicos, "id_usuario", "nombre", "Elija...");
    campo("cajaFiltroTrabajador").classList.remove("d-none");
    campo("cajaTrabajador").classList.remove("d-none");
    campo("id_usuario").required = true;
  }
}

async function cargar() {
  const filtros = new URLSearchParams();
  if (campo("buscar").value.trim()) filtros.set("buscar", campo("buscar").value.trim());
  if (campo("filtroEstado").value) filtros.set("estado", campo("filtroEstado").value);
  if (puedeAsignar && campo("filtroTrabajador").value) filtros.set("id_usuario", campo("filtroTrabajador").value);
  if (campo("desde").value) filtros.set("desde", campo("desde").value);
  if (campo("hasta").value) filtros.set("hasta", campo("hasta").value);
  try {
    trabajos = await api("/trabajos?" + filtros);
    dibujarTabla();
  } catch (error) {
    tabla.innerHTML = `<tr><td colspan="8" class="text-danger">${esc(error.message)}</td></tr>`;
  }
}

function dibujarTabla() {
  campo("contador").textContent = trabajos.length;

  const terminados = trabajos.filter(t => t.estado === "TERMINADO");
  const activos = trabajos.filter(t => t.estado !== "TERMINADO");
  const suma = lista => lista.reduce((s, t) => s + t.costo, 0);
  campo("resumen").innerHTML = `
    <div class="col-md-4"><div class="card tarjeta-kpi shadow-sm"><div class="card-body">
      <div class="small text-secondary">${esTrabajador ? "Ya terminaste" : "Mano de obra terminada"}</div>
      <div class="fs-5 fw-bold text-success">${pesos(suma(terminados))}</div>
      <div class="small text-secondary">${terminados.length} trabajos</div>
    </div></div></div>
    <div class="col-md-4"><div class="card tarjeta-kpi shadow-sm"><div class="card-body">
      <div class="small text-secondary">${esTrabajador ? "Te falta" : "Mano de obra por terminar"}</div>
      <div class="fs-5 fw-bold text-warning">${pesos(suma(activos))}</div>
      <div class="small text-secondary">${activos.length} trabajos</div>
    </div></div></div>
    <div class="col-md-4"><div class="card tarjeta-kpi shadow-sm"><div class="card-body">
      <div class="small text-secondary">Avance</div>
      <div class="fs-5 fw-bold">${trabajos.length ? Math.round(terminados.length / trabajos.length * 100) : 0}%</div>
      <div class="progress barra-dato mt-1"><div class="progress-bar" style="width:${trabajos.length ? terminados.length / trabajos.length * 100 : 0}%"></div></div>
    </div></div></div>`;

  if (!trabajos.length) {
    tabla.innerHTML = '<tr><td colspan="8" class="text-center text-secondary py-4">No hay trabajos con esos filtros.</td></tr>';
    return;
  }
  tabla.innerHTML = trabajos.map(t => `
    <tr>
      <td class="small text-nowrap">${fecha(t.fecha)}${t.fecha_terminado ? `<br><span class="text-success">✔ ${fecha(t.fecha_terminado)}</span>` : ""}</td>
      <td class="text-nowrap"><strong>${esc(t.placa)}</strong>${t.apodo ? `<br><span class="small text-taller">${esc(t.apodo)}</span>` : ""}</td>
      <td>${esc(t.cliente)}</td>
      <td class="small">${esc(t.descripcion)}
        ${t.repuestos ? `<div class="text-secondary"><i class="bi bi-box-seam"></i> ${esc(t.repuestos)} · ${pesos(t.valor_repuestos)}</div>` : ""}
      </td>
      <td class="small">${esc(t.trabajador)}</td>
      <td class="text-end fw-semibold">${pesos(t.costo)}</td>
      <td><span class="badge ${COLOR_ESTADO[t.estado]}">${t.estado}</span></td>
      <td class="text-end text-nowrap">
        ${SIGUIENTE[t.estado] ? `<button class="btn btn-sm btn-outline-success" data-avanzar="${t.id_trabajo}" title="Pasar a ${SIGUIENTE[t.estado]}"><i class="bi bi-arrow-right-circle"></i></button>` : ""}
        <button class="btn btn-sm btn-outline-secondary" data-editar="${t.id_trabajo}" title="Editar"><i class="bi bi-pencil"></i></button>
        ${esAdmin ? `<button class="btn btn-sm btn-outline-danger" data-eliminar="${t.id_trabajo}" title="Eliminar"><i class="bi bi-trash"></i></button>` : ""}
      </td>
    </tr>`).join("");
}

let espera;
campo("buscar").addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(cargar, 300); });
["filtroEstado", "filtroTrabajador", "desde", "hasta"].forEach(id => campo(id).addEventListener("change", cargar));

function abrirFormulario(trabajo = null) {
  form.reset();
  form.classList.remove("was-validated");
  editandoId = trabajo ? trabajo.id_trabajo : null;
  campo("tituloModal").textContent = trabajo ? "Editar trabajo" : "Nuevo trabajo";
  if (trabajo) {
    ["id_moto", "descripcion", "costo", "estado"].forEach(c => campo(c).value = trabajo[c]);
    if (puedeAsignar) campo("id_usuario").value = trabajo.id_usuario;
  } else {
    campo("costo").value = "";
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
    id_usuario: puedeAsignar ? Number(campo("id_usuario").value) : null,
    descripcion: campo("descripcion").value.trim(),
    costo: Number(campo("costo").value),
    estado: campo("estado").value,
  };
  try {
    await guardar(editandoId, datos);
    mostrarMensaje("exito", editandoId ? "Trabajo actualizado" : "Trabajo asignado");
    modal.hide();
    cargar();
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

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
      mostrarMensaje("exito", nuevo === "TERMINADO"
        ? `¡${trabajo.placa} terminado! Se sumaron ${pesos(trabajo.costo)} de mano de obra`
        : `Trabajo de ${trabajo.placa} → ${nuevo}`);
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

tabla.innerHTML = `<tr><td colspan="8">${cargando()}</td></tr>`;
cargarListas().then(cargar).catch(error => mostrarMensaje("error", error.message));
alActualizar(cargar);


