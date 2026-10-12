# routers/repuestos.py - Direcciones del inventario de repuestos
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.repuesto import Repuesto, RepuestoEntrada
from services import repuesto_service as servicio
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/repuestos", tags=["Repuestos"])
SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))


@router.get("", response_model=List[Repuesto])
def listar(buscar: Optional[str] = None, id_categoria: Optional[int] = None,
           id_marca: Optional[int] = None, solo_stock_bajo: bool = False,
           usuario=Depends(usuario_actual)):
    return servicio.listar(buscar, id_categoria, id_marca, solo_stock_bajo)


@router.get("/{id_repuesto}", response_model=Repuesto)
def obtener(id_repuesto: int, usuario=Depends(usuario_actual)):
    repuesto = servicio.obtener(id_repuesto)
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    return repuesto


@router.post("", response_model=Repuesto, status_code=201)
def crear(datos: RepuestoEntrada, usuario=SOLO_ADMIN):
    return servicio.crear(datos)


@router.put("/{id_repuesto}", response_model=Repuesto)
def actualizar(id_repuesto: int, datos: RepuestoEntrada, usuario=SOLO_ADMIN):
    repuesto = servicio.actualizar(id_repuesto, datos)
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    return repuesto


@router.delete("/{id_repuesto}")
def eliminar(id_repuesto: int, usuario=SOLO_ADMIN):
    if not servicio.eliminar(id_repuesto):
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    return {"mensaje": "Repuesto eliminado"}


