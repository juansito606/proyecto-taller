# schemas/trabajo.py - Valida los datos de los trabajos del taller
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

Estado = Literal["PENDIENTE", "EN PROCESO", "TERMINADO"]


class TrabajoEntrada(BaseModel):
    id_moto: int
    id_usuario: Optional[int] = Field(None, description="Trabajador. Si lo registra un trabajador, se pone solo")
    descripcion: str = Field(..., min_length=5, max_length=300)
    fecha: Optional[datetime] = Field(None, description="Si se deja vacía, se usa la fecha de hoy")
    costo: float = Field(0, ge=0)
    estado: Estado = "PENDIENTE"


class Trabajo(BaseModel):
    id_trabajo: int
    id_moto: int
    placa: str
    apodo: Optional[str] = None
    cliente: str
    id_usuario: int
    trabajador: str
    descripcion: str
    fecha: datetime
    costo: float
    estado: Estado
    estado: Estado
    fecha_terminado: Optional[datetime] = None


    