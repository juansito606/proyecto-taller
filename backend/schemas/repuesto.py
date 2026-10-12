# schemas/repuesto.py - Valida los datos de los repuestos
from typing import Optional
from pydantic import BaseModel, Field


class RepuestoEntrada(BaseModel):
    referencia: str = Field(..., min_length=2, max_length=30)
    nombre: str = Field(..., min_length=3, max_length=100)
    id_categoria: int
    id_marca: int
    precio: float = Field(..., gt=0, description="Mayor que 0")
    stock: int = Field(0, ge=0, description="No puede ser negativo")
    stock_minimo: int = Field(5, ge=0)


class Repuesto(RepuestoEntrada):
    id_repuesto: int
    categoria: Optional[str] = None
    marca: Optional[str] = None
    stock_bajo: bool = False

    