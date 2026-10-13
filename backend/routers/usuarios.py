# routers/usuarios.py - Gestión de usuarios y roles (solo administrador)
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.usuario import Rol, Usuario, UsuarioEntrada
from services import usuario_service as servicio
from services.auth_service import requiere_rol

SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))
ADMIN_O_VENDEDOR = Depends(requiere_rol("ADMINISTRADOR", "VENDEDOR"))
router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])
router_roles = APIRouter(prefix="/api/roles", tags=["Usuarios"])


@router_roles.get("", response_model=List[Rol])
def listar_roles(usuario=SOLO_ADMIN):
    return servicio.listar_roles()


@router.get("", response_model=List[Usuario])
def listar(buscar: Optional[str] = None, id_rol: Optional[int] = None, usuario=SOLO_ADMIN):
    return servicio.listar(buscar, id_rol)


@router.get("/mecanicos")
def listar_mecanicos(usuario=ADMIN_O_VENDEDOR):
    return servicio.listar_mecanicos()


@router.get("/{id_usuario}", response_model=Usuario)
def obtener(id_usuario: int, usuario=SOLO_ADMIN):
    encontrado = servicio.obtener(id_usuario)
    if not encontrado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return encontrado


@router.post("", response_model=Usuario, status_code=201)
def crear(datos: UsuarioEntrada, usuario=SOLO_ADMIN):
    if not datos.contrasena:
        raise HTTPException(status_code=400, detail="La contraseña es obligatoria al crear un usuario")
    return servicio.crear(datos)


@router.put("/{id_usuario}", response_model=Usuario)
def actualizar(id_usuario: int, datos: UsuarioEntrada, usuario=SOLO_ADMIN):
    if id_usuario == usuario["id_usuario"] and datos.activo == "N":
        raise HTTPException(status_code=400, detail="No puede desactivar su propio usuario")
    actualizado = servicio.actualizar(id_usuario, datos)
    if not actualizado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return actualizado


@router.delete("/{id_usuario}")
def eliminar(id_usuario: int, usuario=SOLO_ADMIN):
    if id_usuario == usuario["id_usuario"]:
        raise HTTPException(status_code=400, detail="No puede eliminar su propio usuario")
    if not servicio.eliminar(id_usuario):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"mensaje": "Usuario eliminado"}


