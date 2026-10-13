# routers/tipos_trabajo.py - Tipos de trabajo: todos los ven; admin y vendedora los crean y editan
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.tipo_trabajo import TipoTrabajo, TipoTrabajoEntrada
from services import tipo_trabajo_service as servicio
from services import actividad_service as actividad
from services.actividad_service import pesos
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/tipos-trabajo", tags=["Tipos de trabajo"])
ADMIN_O_VENDEDOR = Depends(requiere_rol("ADMINISTRADOR", "VENDEDOR"))
SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))


@router.get("", response_model=List[TipoTrabajo])
def listar(buscar: Optional[str] = None, usuario=Depends(usuario_actual)):
    return servicio.listar(buscar)


@router.get("/{id_tipo}", response_model=TipoTrabajo)
def obtener(id_tipo: int, usuario=Depends(usuario_actual)):
    tipo = servicio.obtener(id_tipo)
    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de trabajo no encontrado")
    return tipo


@router.post("", response_model=TipoTrabajo, status_code=201)
def crear(datos: TipoTrabajoEntrada, usuario=ADMIN_O_VENDEDOR):
    tipo = servicio.crear(datos)
    actividad.registrar(usuario["id_usuario"], "INVENTARIO", "creó un nuevo tipo de trabajo",
                        f"{tipo['nombre']} · Precio sugerido {pesos(tipo['precio_sugerido'])}")
    return tipo


@router.put("/{id_tipo}", response_model=TipoTrabajo)
def actualizar(id_tipo: int, datos: TipoTrabajoEntrada, usuario=ADMIN_O_VENDEDOR):
    tipo = servicio.actualizar(id_tipo, datos)
    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de trabajo no encontrado")
    actividad.registrar(usuario["id_usuario"], "EDICION", "editó un tipo de trabajo",
                        f"{tipo['nombre']} · Precio sugerido {pesos(tipo['precio_sugerido'])}")
    return tipo


@router.delete("/{id_tipo}")
def eliminar(id_tipo: int, usuario=SOLO_ADMIN):
    antes = servicio.obtener(id_tipo)
    if not antes or not servicio.eliminar(id_tipo):
        raise HTTPException(status_code=404, detail="Tipo de trabajo no encontrado")
    actividad.registrar(usuario["id_usuario"], "ELIMINACION", "borró un tipo de trabajo", antes["nombre"])
    return {"mensaje": "Tipo de trabajo eliminado"}


