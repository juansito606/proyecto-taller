// catalogo.js - Categorías, marcas y tipos de trabajo (admin y vendedora; solo el admin elimina)
const usuario = iniciarPagina(["ADMINISTRADOR", "VENDEDOR"]);
const esAdmin = usuario.rol === "ADMINISTRADOR";

const form = document.getElementById("formCatalogo");
const modal = new bootstrap.Modal("#modalCatalogo");
const campo = id => document.getElementById(id);

// Las tres listas funcionan igual; solo cambia esta configuración
const TIPOS = {
  categorias: { ruta: "/categorias",    id: "id_categoria", nombre: "categoría",       largo: 50, descripcion: 150, datos: [] },
  marcas:     { ruta: "/marcas",        id: "id_marca",     nombre: "marca",           largo: 50, descripcion: 0,   datos: [] },
  tipos:      { ruta: "/tipos-trabajo", id: "id_tipo",      nombre: "tipo de trabajo", largo: 60, descripcion: 200, conPrecio: true, datos: [] },
};

let tipoActual = null;
let editandoId = null;

function columnas(t) {
  return 2 + (t.descripcion ? 1 : 0) + (t.conPrecio ? 2 : 0);
}

function fila(tipo, t, x) {
  return `
    <tr>
      <td class="fw-semibold">${esc(x.nombre)}</td>
      ${t.descripcion ? `<td class="small text-secondary">${esc(x.descripcion || "—")}</td>` : ""}
      ${t.conPrecio ? `
        <td class="text-end">${pesos(x.precio_sugerido)}</td>
        <td class="text-center"><span class="badge text-bg-secondary">${x.trabajos}</span></td>` : ""}
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-secondary" data-editar="${tipo}" data-id="${x[t.id]}" title="Editar"><i class="bi bi-pencil"></i></button>
        ${esAdmin ? `<button class="btn btn-sm btn-outline-danger" data-eliminar="${tipo}" data-id="${x[t.id]}" title="Eliminar"><i class="bi bi-trash"></i></button>` : ""}
      </td>
    </tr>`;
}

async function cargar(tipo) {
  const t = TIPOS[tipo];
  const buscar = campo("buscar-" + tipo).value.trim();
  campo("tabla-" + tipo).innerHTML = `<tr><td colspan="${columnas(t)}">${cargando()}</td></tr>`;
  try {
    t.datos = await api(t.ruta + (buscar ? "?buscar=" + encodeURIComponent(buscar) : ""));
    campo("contador-" + tipo).textContent = t.datos.length;
    campo("tabla-" + tipo).innerHTML = t.datos.length ? t.datos.map(x => fila(tipo, t, x)).join("")
      : `<tr><td colspan="${columnas(t)}" class="text-secondary">Sin resultados.</td></tr>`;
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
}

// Búsqueda con pausa
for (const tipo of Object.keys(TIPOS)) {
  let espera;
  campo("buscar-" + tipo).addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(() => cargar(tipo), 300); });
}

function abrirFormulario(tipo, registro = null) {
  const t = TIPOS[tipo];
  tipoActual = tipo;
  editandoId = registro ? registro[t.id] : null;
  form.reset();
  form.classList.remove("was-validated");
  campo("tituloModal").textContent = (registro ? "Editar " : "Agregar ") + t.nombre;
  campo("nombre").maxLength = t.largo;
  campo("descripcion").maxLength = t.descripcion || 150;
  campo("cajaDescripcion").classList.toggle("d-none", !t.descripcion);
  campo("cajaPrecio").classList.toggle("d-none", !t.conPrecio);
  campo("precio_sugerido").value = 0;
  if (registro) {
    campo("nombre").value = registro.nombre;
    campo("descripcion").value = registro.descripcion || "";
    if (t.conPrecio) campo("precio_sugerido").value = registro.precio_sugerido;
  }
  modal.show();
}

// Todos los botones de la página (nuevo, editar, eliminar)
document.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("[data-nuevo], [data-editar], [data-eliminar]");
  if (!boton) return;

  if (boton.dataset.nuevo) return abrirFormulario(boton.dataset.nuevo);

  const tipo = boton.dataset.editar || boton.dataset.eliminar;
  const t = TIPOS[tipo];
  const registro = t.datos.find(x => x[t.id] == boton.dataset.id);

  if (boton.dataset.editar) return abrirFormulario(tipo, registro);

  if (!await confirmar(`¿Eliminar "${registro.nombre}"?`)) return;
  try {
    await api(`${t.ruta}/${boton.dataset.id}`, { method: "DELETE" });
    mostrarMensaje("exito", `"${registro.nombre}" eliminado del catálogo`);
    cargar(tipo);
  } catch (error) {
    mostrarMensaje("error", error.message);   // si ya se usa en repuestos o trabajos, Oracle no deja
  }
});

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }
  const t = TIPOS[tipoActual];
  const datos = { nombre: campo("nombre").value.trim() };
  if (t.descripcion) datos.descripcion = campo("descripcion").value.trim() || null;
  if (t.conPrecio) datos.precio_sugerido = Number(campo("precio_sugerido").value) || 0;

  try {
    await api(editandoId ? `${t.ruta}/${editandoId}` : t.ruta,
              { method: editandoId ? "PUT" : "POST", body: JSON.stringify(datos) });
    mostrarMensaje("exito", `"${datos.nombre}" guardado`);
    modal.hide();
    cargar(tipoActual);
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

cargar("categorias");
cargar("marcas");
cargar("tipos");

