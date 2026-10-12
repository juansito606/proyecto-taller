# schemas/cliente.py - Valida los datos de los clientes
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ClienteEntrada(BaseModel):
    documento: str = Field(..., pattern=r"^[0-9]{5,20}$", description="Solo números")
    nombre: str = Field(..., min_length=3, max_length=100)
    telefono: str = Field(..., pattern=r"^[0-9+ ]{7,20}$")
    correo: Optional[str] = Field(None, max_length=100, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class Cliente(ClienteEntrada):
    id_cliente: int
    fecha_registro: Optional[datetime] = None

    