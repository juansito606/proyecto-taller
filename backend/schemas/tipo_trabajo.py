# schemas/tipo_trabajo.py - Valida los tipos de trabajo (los servicios que ofrece el taller)
from typing import Optional
from pydantic import BaseModel, Field


class TipoTrabajoEntrada(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)
    precio_sugerido: float = Field(0, ge=0, description="Valor de mano de obra que se propone al escoger este tipo")


class TipoTrabajo(TipoTrabajoEntrada):
    id_tipo: int
    trabajos: int = 0
    