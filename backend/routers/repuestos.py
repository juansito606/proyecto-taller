# routers/repuestos.py - Inventario: todos ven; admin y vendedor lo administran (queda en la bitácora)
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.repuesto import Repuesto, RepuestoEntrada
from services import repuesto_service as servicio
from services import actividad_service as actividad
from services.actividad_service import pesos
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/repuestos", tags=["Repuestos"])
ADMIN_O_VENDEDOR = Depends(requiere_rol("ADMINISTRADOR", "VENDEDOR"))


def _texto(r):
    return f"{r['nombre']} ({r['referencia']}) · Precio {pesos(r['precio'])} · Stock {r['stock']}"


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
def crear(datos: RepuestoEntrada, usuario=ADMIN_O_VENDEDOR):
    repuesto = servicio.crear(datos)
    actividad.registrar(usuario["id_usuario"], "INVENTARIO", "agregó un repuesto al inventario", _texto(repuesto))
    return repuesto


@router.put("/{id_repuesto}", response_model=Repuesto)
def actualizar(id_repuesto: int, datos: RepuestoEntrada, usuario=ADMIN_O_VENDEDOR):
    repuesto = servicio.actualizar(id_repuesto, datos)
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    actividad.registrar(usuario["id_usuario"], "INVENTARIO", "editó un repuesto", _texto(repuesto))
    return repuesto


@router.delete("/{id_repuesto}")
def eliminar(id_repuesto: int, usuario=ADMIN_O_VENDEDOR):
    antes = servicio.obtener(id_repuesto)
    if not antes or not servicio.eliminar(id_repuesto):
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    actividad.registrar(usuario["id_usuario"], "ELIMINACION", "borró un repuesto del inventario", _texto(antes))
    return {"mensaje": "Repuesto eliminado"}


