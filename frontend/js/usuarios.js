// usuarios.js - Gestión de usuarios y roles (solo administrador)
const yo = iniciarPagina(["ADMINISTRADOR"]);

const tabla = document.getElementById("tabla");
const form = document.getElementById("formUsuario");
const modal = new bootstrap.Modal("#modalUsuario");
const campo = id => document.getElementById(id);

const COLOR_ROL = { ADMINISTRADOR: "bg-taller", VENDEDOR: "text-bg-primary", TRABAJADOR: "text-bg-secondary" };

let usuarios = [];
let editandoId = null;

async function cargarRoles() {
  const roles = await api("/roles");
  llenarSelect(campo("filtroRol"), roles, "id_rol", "nombre", "Todos los roles");
  llenarSelect(campo("id_rol"), roles, "id_rol", "nombre", "Elija...");
}

async function cargar() {
  const filtros = new URLSearchParams();
  if (campo("buscar").value.trim()) filtros.set("buscar", campo("buscar").value.trim());
  if (campo("filtroRol").value) filtros.set("id_rol", campo("filtroRol").value);

  tabla.innerHTML = `<tr><td colspan="6">${cargando()}</td></tr>`;
  try {
    usuarios = await api("/usuarios?" + filtros);
    dibujarTabla();
  } catch (error) {
    tabla.innerHTML = `<tr><td colspan="6" class="text-danger">${esc(error.message)}</td></tr>`;
  }
}

function dibujarTabla() {
  campo("contador").textContent = usuarios.length;
  tabla.innerHTML = usuarios.map(u => {
    const soyYo = u.id_usuario === yo.id_usuario;
    const activo = u.activo === "S";
    return `
      <tr class="${activo ? "" : "table-secondary text-secondary"}">
        <td class="fw-semibold">${esc(u.nombre)} ${soyYo ? '<span class="badge text-bg-light">tú</span>' : ""}</td>
        <td><code>${esc(u.usuario)}</code></td>
        <td><span class="badge ${COLOR_ROL[u.rol]}">${u.rol}</span></td>
        <td><span class="badge ${activo ? "text-bg-success" : "text-bg-dark"}">${activo ? "Activo" : "Inactivo"}</span></td>
        <td class="small">${fecha(u.fecha_creacion)}</td>
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-outline-secondary" data-editar="${u.id_usuario}" title="Editar"><i class="bi bi-pencil"></i></button>
          ${soyYo ? "" : `
          <button class="btn btn-sm ${activo ? "btn-outline-warning" : "btn-outline-success"}" data-acceso="${u.id_usuario}"
                  title="${activo ? "Quitar acceso" : "Dar acceso"}"><i class="bi bi-${activo ? "lock" : "unlock"}"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-eliminar="${u.id_usuario}" title="Eliminar"><i class="bi bi-trash"></i></button>`}
        </td>
      </tr>`;
  }).join("");
}

let espera;
campo("buscar").addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(cargar, 300); });
campo("filtroRol").addEventListener("change", cargar);

function abrirFormulario(u = null) {
  form.reset();
  form.classList.remove("was-validated");
  editandoId = u ? u.id_usuario : null;
  campo("tituloModal").textContent = u ? "Editar usuario" : "Nuevo usuario";
  // La contraseña es obligatoria solo al crear
  campo("contrasena").required = !u;
  campo("etiquetaContrasena").textContent = u ? "Nueva contraseña" : "Contraseña *";
  campo("notaContrasena").classList.toggle("d-none", !u);
  if (u) ["nombre", "usuario", "id_rol", "activo"].forEach(c => campo(c).value = u[c]);
  modal.show();
}

campo("btnNuevo").addEventListener("click", () => abrirFormulario());

async function guardar(id, datos) {
  return api(id ? `/usuarios/${id}` : "/usuarios",
             { method: id ? "PUT" : "POST", body: JSON.stringify(datos) });
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    mostrarMensaje("advertencia", "Revise los campos marcados en rojo");
    return;
  }
  const datos = {
    nombre: campo("nombre").value.trim(),
    usuario: campo("usuario").value.trim().toLowerCase(),
    contrasena: campo("contrasena").value || null,
    id_rol: Number(campo("id_rol").value),
    activo: campo("activo").value,
  };
  try {
    await guardar(editandoId, datos);
    mostrarMensaje("exito", editandoId ? "Usuario actualizado" : `Usuario ${datos.usuario} creado`);
    modal.hide();
    cargar();
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

tabla.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("button");
  if (!boton) return;
  const id = Number(boton.dataset.editar || boton.dataset.acceso || boton.dataset.eliminar);
  const u = usuarios.find(x => x.id_usuario === id);

  try {
    if (boton.dataset.editar) return abrirFormulario(u);

    if (boton.dataset.acceso) {
      const nuevo = u.activo === "S" ? "N" : "S";
      const pregunta = nuevo === "N" ? `¿Quitarle el acceso a ${u.nombre}? Se cerrará su sesión.` : `¿Devolverle el acceso a ${u.nombre}?`;
      if (!await confirmar(pregunta)) return;
      await guardar(id, { nombre: u.nombre, usuario: u.usuario, contrasena: null, id_rol: u.id_rol, activo: nuevo });
      mostrarMensaje(nuevo === "N" ? "advertencia" : "exito", `${u.nombre} ${nuevo === "N" ? "ya no tiene acceso" : "puede entrar de nuevo"}`);
      cargar();
    }

    if (boton.dataset.eliminar) {
      if (!await confirmar(`¿Eliminar a ${u.nombre}? Si tiene historial, mejor quítele el acceso.`)) return;
      await api(`/usuarios/${id}`, { method: "DELETE" });
      mostrarMensaje("exito", "Usuario eliminado");
      cargar();
    }
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
});

cargarRoles().then(cargar).catch(error => mostrarMensaje("error", error.message));


