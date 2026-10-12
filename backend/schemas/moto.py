# schemas/moto.py - Valida los datos de las motos de los clientes
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class MotoEntrada(BaseModel):
    placa: str = Field(..., pattern=r"^[A-Za-z0-9]{5,7}$", description="Ej: JCI56I")
    marca: str = Field(..., min_length=2, max_length=40)
    modelo: str = Field(..., min_length=1, max_length=60)
    anio: Optional[int] = Field(None, ge=1950, le=2100)
    apodo: Optional[str] = Field(None, max_length=40)
    id_cliente: int

    @field_validator("placa")
    @classmethod
    def placa_mayuscula(cls, valor):
        return valor.upper()


class Moto(MotoEntrada):
    id_moto: int
    cliente: Optional[str] = None

    