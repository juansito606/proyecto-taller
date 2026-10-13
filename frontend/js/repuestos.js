// repuestos.js - Inventario: listar, buscar, filtrar, crear, editar y eliminar
const usuario = iniciarPagina();
const esAdmin = ["ADMINISTRADOR", "VENDEDOR"].includes(usuario.rol);   // Sofía también maneja el inventario

const tabla = document.getElementById("tabla");
const form = document.getElementById("formRepuesto");
const modal = new bootstrap.Modal("#modalRepuesto");
const campo = id => document.getElementById(id);

let repuestos = [];
let editandoId = null;

// El administrador ve los botones de crear, editar y eliminar
if (esAdmin) {
  campo("btnNuevo").classList.remove("d-none");
  document.querySelectorAll(".solo-admin").forEach(e => e.classList.remove("d-none"));
}

// ---------- Cargar categorías y marcas para los filtros y el formulario ----------
async function cargarListas() {
  const [categorias, marcas] = await Promise.all([api("/categorias"), api("/marcas")]);
  llenarSelect(campo("filtroCategoria"), categorias, "id_categoria", "nombre", "Todas las categorías");
  llenarSelect(campo("filtroMarca"), marcas, "id_marca", "nombre", "Todas las marcas");
  llenarSelect(campo("id_categoria"), categorias, "id_categoria", "nombre", "Elija...");
  llenarSelect(campo("id_marca"), marcas, "id_marca", "nombre", "Elija...");
}

// ---------- Listar con los filtros que estén puestos ----------
async function cargarRepuestos() {
  const filtros = new URLSearchParams();
  if (campo("buscar").value.trim()) filtros.set("buscar", campo("buscar").value.trim());
  if (campo("filtroCategoria").value) filtros.set("id_categoria", campo("filtroCategoria").value);
  if (campo("filtroMarca").value) filtros.set("id_marca", campo("filtroMarca").value);
  if (campo("filtroStockBajo").checked) filtros.set("solo_stock_bajo", "true");

  tabla.innerHTML = `<tr><td colspan="7">${cargando()}</td></tr>`;
  try {
    repuestos = await api("/repuestos?" + filtros);
    dibujarTabla();
  } catch (error) {
    tabla.innerHTML = `<tr><td colspan="7" class="text-danger">${esc(error.message)}</td></tr>`;
  }
}

function dibujarTabla() {
  campo("contador").textContent = repuestos.length;
  if (!repuestos.length) {
    tabla.innerHTML = '<tr><td colspan="7" class="text-center text-secondary py-4">No se encontraron repuestos.</td></tr>';
    return;
  }
  tabla.innerHTML = repuestos.map(r => `
    <tr class="${r.stock_bajo ? "table-danger" : ""}">
      <td><code>${esc(r.referencia)}</code></td>
      <td>${esc(r.nombre)}</td>
      <td>${esc(r.categoria)}</td>
      <td>${esc(r.marca)}</td>
      <td class="text-end">${pesos(r.precio)}</td>
      <td class="text-center">
        <span class="badge ${r.stock_bajo ? "text-bg-danger" : "text-bg-success"}">${r.stock}</span>
        ${r.stock_bajo ? '<i class="bi bi-exclamation-triangle text-danger" title="Stock bajo"></i>' : ""}
      </td>
      ${esAdmin ? `
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-secondary" data-editar="${r.id_repuesto}" title="Editar"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-eliminar="${r.id_repuesto}" title="Eliminar"><i class="bi bi-trash"></i></button>
      </td>` : ""}
    </tr>`).join("");
}

// ---------- Filtros: se aplican solos al escribir o cambiar ----------
let espera;
campo("buscar").addEventListener("input", () => {
  clearTimeout(espera);
  espera = setTimeout(cargarRepuestos, 300);   // espera a que termine de escribir
});
["filtroCategoria", "filtroMarca", "filtroStockBajo"].forEach(id =>
  campo(id).addEventListener("change", cargarRepuestos));

// ---------- Abrir el formulario ----------
function abrirFormulario(repuesto = null) {
  form.reset();
  form.classList.remove("was-validated");
  editandoId = repuesto ? repuesto.id_repuesto : null;
  campo("tituloModal").textContent = repuesto ? "Editar repuesto" : "Nuevo repuesto";

  // Al editar, el stock no se toca aquí: se mueve con compras y ventas
  campo("stock").disabled = !!repuesto;
  campo("notaStock").classList.toggle("d-none", !repuesto);

  if (repuesto) {
    ["referencia", "nombre", "id_categoria", "id_marca", "precio", "stock", "stock_minimo"]
      .forEach(c => campo(c).value = repuesto[c]);
  } else {
    campo("stock").value = 0;
    campo("stock_minimo").value = 5;
  }
  modal.show();
}

campo("btnNuevo").addEventListener("click", () => abrirFormulario());

// ---------- Botones de la tabla: editar y eliminar ----------
tabla.addEventListener("click", async (evento) => {
  const botonEditar = evento.target.closest("[data-editar]");
  const botonEliminar = evento.target.closest("[data-eliminar]");

  if (botonEditar) {
    abrirFormulario(repuestos.find(r => r.id_repuesto == botonEditar.dataset.editar));
  }

  if (botonEliminar) {
    const repuesto = repuestos.find(r => r.id_repuesto == botonEliminar.dataset.eliminar);
    if (!await confirmar(`¿Eliminar "${repuesto.nombre}"?`)) return;
    try {
      await api(`/repuestos/${repuesto.id_repuesto}`, { method: "DELETE" });
      mostrarMensaje("exito", "Repuesto eliminado");
      cargarRepuestos();
    } catch (error) {
      mostrarMensaje("error", error.message);
    }
  }
});

// ---------- Guardar (crear o editar) ----------
form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!form.checkValidity()) {                 // validación en el frontend
    form.classList.add("was-validated");
    mostrarMensaje("advertencia", "Revise los campos marcados en rojo");
    return;
  }

  const datos = {
    referencia: campo("referencia").value.trim().toUpperCase(),
    nombre: campo("nombre").value.trim(),
    id_categoria: Number(campo("id_categoria").value),
    id_marca: Number(campo("id_marca").value),
    precio: Number(campo("precio").value),
    stock: Number(campo("stock").value),
    stock_minimo: Number(campo("stock_minimo").value),
  };

  const boton = campo("btnGuardar");
  boton.disabled = true;
  try {
    if (editandoId) {
      await api(`/repuestos/${editandoId}`, { method: "PUT", body: JSON.stringify(datos) });
      mostrarMensaje("exito", "Repuesto actualizado");
    } else {
      await api("/repuestos", { method: "POST", body: JSON.stringify(datos) });
      mostrarMensaje("exito", "Repuesto creado");
    }
    modal.hide();
    cargarRepuestos();
  } catch (error) {
    mostrarMensaje("error", error.message);   // por ejemplo: "Ya existe un registro con ese valor"
  } finally {
    boton.disabled = false;
  }
});

// ---------- Arrancar ----------
cargarListas().then(cargarRepuestos).catch(error => mostrarMensaje("error", error.message));


