// catalogo.js - Categorías y marcas (solo administrador)
iniciarPagina(["ADMINISTRADOR"]);

const form = document.getElementById("formCatalogo");
const modal = new bootstrap.Modal("#modalCatalogo");
const campo = id => document.getElementById(id);

// Las dos listas funcionan igual; solo cambia esta configuración
const TIPOS = {
  categorias: { ruta: "/categorias", id: "id_categoria", nombre: "categoría", conDescripcion: true, datos: [] },
  marcas:     { ruta: "/marcas",     id: "id_marca",     nombre: "marca",     conDescripcion: false, datos: [] },
};

let tipoActual = null;
let editandoId = null;

async function cargar(tipo) {
  const t = TIPOS[tipo];
  const buscar = campo("buscar-" + tipo).value.trim();
  const columnas = t.conDescripcion ? 3 : 2;
  campo("tabla-" + tipo).innerHTML = `<tr><td colspan="${columnas}">${cargando()}</td></tr>`;
  try {
    t.datos = await api(t.ruta + (buscar ? "?buscar=" + encodeURIComponent(buscar) : ""));
    campo("contador-" + tipo).textContent = t.datos.length;
    campo("tabla-" + tipo).innerHTML = t.datos.length ? t.datos.map(x => `
      <tr>
        <td class="fw-semibold">${esc(x.nombre)}</td>
        ${t.conDescripcion ? `<td class="small text-secondary">${esc(x.descripcion || "—")}</td>` : ""}
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-outline-secondary" data-editar="${tipo}" data-id="${x[t.id]}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-eliminar="${tipo}" data-id="${x[t.id]}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join("")
      : `<tr><td colspan="${columnas}" class="text-secondary">Sin resultados.</td></tr>`;
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
  campo("tituloModal").textContent = (registro ? "Editar " : "Nueva ") + t.nombre;
  campo("cajaDescripcion").classList.toggle("d-none", !t.conDescripcion);
  if (registro) {
    campo("nombre").value = registro.nombre;
    campo("descripcion").value = registro.descripcion || "";
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

  if (!await confirmar(`¿Eliminar la ${t.nombre} "${registro.nombre}"?`)) return;
  try {
    await api(`${t.ruta}/${boton.dataset.id}`, { method: "DELETE" });
    mostrarMensaje("exito", `${registro.nombre} eliminada`);
    cargar(tipo);
  } catch (error) {
    mostrarMensaje("error", error.message);   // si tiene repuestos, Oracle no deja
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
  if (t.conDescripcion) datos.descripcion = campo("descripcion").value.trim() || null;

  try {
    await api(editandoId ? `${t.ruta}/${editandoId}` : t.ruta,
              { method: editandoId ? "PUT" : "POST", body: JSON.stringify(datos) });
    mostrarMensaje("exito", `${datos.nombre} guardada`);
    modal.hide();
    cargar(tipoActual);
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

cargar("categorias");
cargar("marcas");


