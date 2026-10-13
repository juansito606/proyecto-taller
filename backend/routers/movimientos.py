# routers/movimientos.py - Compras a proveedores (las ventas van por /api/ventas) + bitácora
from datetime import date
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.movimiento import Movimiento, MovimientoEntrada
from services import movimiento_service as servicio
from services import actividad_service as actividad
from services.actividad_service import pesos
from services.auth_service import requiere_rol

router = APIRouter(prefix="/api/movimientos", tags=["Movimientos (compras e historial)"])
ADMIN_O_VENDEDOR = Depends(requiere_rol("ADMINISTRADOR", "VENDEDOR"))
SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))


@router.get("", response_model=List[Movimiento])
def listar(tipo: Optional[Literal["VENTA", "COMPRA"]] = None, id_repuesto: Optional[int] = None,
           desde: Optional[date] = None, hasta: Optional[date] = None, usuario=ADMIN_O_VENDEDOR):
    return servicio.listar(tipo, id_repuesto, desde, hasta)


@router.get("/{id_movimiento}", response_model=Movimiento)
def obtener(id_movimiento: int, usuario=ADMIN_O_VENDEDOR):
    movimiento = servicio.obtener(id_movimiento)
    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return movimiento


@router.post("", response_model=Movimiento, status_code=201)
def registrar(datos: MovimientoEntrada, usuario=ADMIN_O_VENDEDOR):
    if datos.tipo == "VENTA":
        raise HTTPException(status_code=400, detail="Las ventas se registran en Ventas (repuestos + mano de obra)")
    compra = servicio.crear(datos, usuario["id_usuario"])
    actividad.registrar(usuario["id_usuario"], "COMPRA", "registró una compra a proveedor",
                        f"{compra['repuesto']} ×{compra['cantidad']} a {pesos(compra['precio_unitario'])} c/u · "
                        f"Total {pesos(compra['total'])}", compra["total"])
    return compra


@router.delete("/{id_movimiento}")
def anular(id_movimiento: int, usuario=SOLO_ADMIN):
    movimiento = servicio.obtener(id_movimiento)
    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    if movimiento["tipo"] == "VENTA":
        raise HTTPException(status_code=400, detail="Las ventas se anulan completas desde Ventas")
    servicio.anular(id_movimiento)
    actividad.registrar(usuario["id_usuario"], "ANULACION", "anuló una compra a proveedor",
                        f"{movimiento['repuesto']} ×{movimiento['cantidad']} · Total {pesos(movimiento['total'])}",
                        movimiento["total"])
    return {"mensaje": "Compra anulada y stock restablecido"}


