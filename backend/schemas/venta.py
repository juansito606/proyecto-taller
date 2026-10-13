# schemas/venta.py - Una venta: repuestos + mano de obra en un solo registro
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class ItemVenta(BaseModel):
    id_repuesto: int
    cantidad: int = Field(..., gt=0)
    precio_unitario: Optional[float] = Field(None, gt=0)


class TrabajoVenta(BaseModel):
    descripcion: str = Field(..., min_length=5, max_length=300)
    id_usuario: int = Field(..., description="Mecánico que hace el trabajo")
    costo: float = Field(..., ge=0, description="Valor de la mano de obra")
    estado: Literal["PENDIENTE", "EN PROCESO", "TERMINADO"] = "PENDIENTE"


class VentaEntrada(BaseModel):
    id_cliente: Optional[int] = None
    id_moto: Optional[int] = None
    trabajo: Optional[TrabajoVenta] = None
    items: List[ItemVenta] = []


    