# schemas/movimiento.py - Valida las ventas y compras
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class MovimientoEntrada(BaseModel):
    tipo: Literal["VENTA", "COMPRA"]
    id_repuesto: int
    cantidad: int = Field(..., gt=0)
    precio_unitario: Optional[float] = Field(None, gt=0, description="Si es venta y se deja vacío, usa el precio del repuesto")
    id_cliente: Optional[int] = None
    id_trabajo: Optional[int] = None


class Movimiento(BaseModel):
    id_movimiento: int
    tipo: str
    id_repuesto: int
    repuesto: str
    cantidad: int
    precio_unitario: float
    total: float
    fecha: datetime
    id_usuario: int
    usuario: str
    id_cliente: Optional[int] = None
    cliente: Optional[str] = None
    id_trabajo: Optional[int] = None

    