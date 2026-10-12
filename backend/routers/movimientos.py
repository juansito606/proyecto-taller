# routers/movimientos.py - Direcciones de ventas y compras
from datetime import date
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.movimiento import Movimiento, MovimientoEntrada
from services import movimiento_service as servicio
from services.auth_service import requiere_rol

router = APIRouter(prefix="/api/movimientos", tags=["Movimientos (ventas y compras)"])
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
    # El movimiento queda a nombre de quien inició sesión
    return servicio.crear(datos, usuario["id_usuario"])


@router.delete("/{id_movimiento}")
def anular(id_movimiento: int, usuario=SOLO_ADMIN):
    if not servicio.anular(id_movimiento):
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return {"mensaje": "Movimiento anulado y stock restablecido"}



