# schemas/trabajo.py - Valida los datos de los trabajos del taller
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

Estado = Literal["PENDIENTE", "EN PROCESO", "TERMINADO"]


class TrabajoEntrada(BaseModel):
    id_moto: int
    id_usuario: Optional[int] = Field(None, description="Mecánico. Si lo registra un trabajador, se pone solo")
    id_tipo: Optional[int] = Field(None, description="Tipo de trabajo (Frenos, Motor, Cambio de aceite...)")
    descripcion: str = Field(..., min_length=5, max_length=300)
    fecha: Optional[datetime] = Field(None, description="Si se deja vacía, se usa la fecha de hoy")
    costo: float = Field(0, ge=0)
    estado: Estado = "PENDIENTE"


class Trabajo(BaseModel):
    id_trabajo: int
    id_moto: int
    placa: str
    apodo: Optional[str] = None
    marca_moto: Optional[str] = None
    modelo_moto: Optional[str] = None
    cliente: str
    id_usuario: int
    trabajador: str
    id_tipo: Optional[int] = None
    tipo: Optional[str] = None
    descripcion: str
    fecha: datetime
    costo: float
    estado: Estado
    fecha_terminado: Optional[datetime] = None
    repuestos: Optional[str] = None
    valor_repuestos: float = 0
    