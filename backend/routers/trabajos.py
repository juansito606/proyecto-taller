# routers/trabajos.py - Direcciones de los trabajos del taller
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.trabajo import Trabajo, TrabajoEntrada
from services import trabajo_service as servicio
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/trabajos", tags=["Trabajos"])
ADMIN_O_TRABAJADOR = Depends(requiere_rol("ADMINISTRADOR", "TRABAJADOR"))
SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))


def _es_trabajador(usuario):
    return usuario["rol"] == "TRABAJADOR"


@router.get("", response_model=List[Trabajo])
def listar(buscar: Optional[str] = None, estado: Optional[str] = None,
           id_usuario: Optional[int] = None, desde: Optional[date] = None,
           hasta: Optional[date] = None, usuario=Depends(usuario_actual)):
    # El trabajador solo puede ver sus propios trabajos
    if _es_trabajador(usuario):
        id_usuario = usuario["id_usuario"]
    return servicio.listar(buscar, estado, id_usuario, desde, hasta)


@router.get("/{id_trabajo}", response_model=Trabajo)
def obtener(id_trabajo: int, usuario=Depends(usuario_actual)):
    trabajo = servicio.obtener(id_trabajo)
    if not trabajo:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if _es_trabajador(usuario) and trabajo["id_usuario"] != usuario["id_usuario"]:
        raise HTTPException(status_code=403, detail="Solo puede ver sus propios trabajos")
    return trabajo


@router.post("", response_model=Trabajo, status_code=201)
def crear(datos: TrabajoEntrada, usuario=ADMIN_O_TRABAJADOR):
    if _es_trabajador(usuario):
        datos.id_usuario = usuario["id_usuario"]   # se registra a su nombre
    elif datos.id_usuario is None:
        raise HTTPException(status_code=400, detail="Debe indicar el trabajador (id_usuario)")
    return servicio.crear(datos)


@router.put("/{id_trabajo}", response_model=Trabajo)
def actualizar(id_trabajo: int, datos: TrabajoEntrada, usuario=ADMIN_O_TRABAJADOR):
    actual = servicio.obtener(id_trabajo)
    if not actual:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if _es_trabajador(usuario):
        if actual["id_usuario"] != usuario["id_usuario"]:
            raise HTTPException(status_code=403, detail="Solo puede modificar sus propios trabajos")
        datos.id_usuario = usuario["id_usuario"]
    elif datos.id_usuario is None:
        datos.id_usuario = actual["id_usuario"]
    return servicio.actualizar(id_trabajo, datos)


@router.delete("/{id_trabajo}")
def eliminar(id_trabajo: int, usuario=SOLO_ADMIN):
    if not servicio.eliminar(id_trabajo):
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    return {"mensaje": "Trabajo eliminado"}

