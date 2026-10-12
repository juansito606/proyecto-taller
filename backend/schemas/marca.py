# schemas/marca.py - Valida los datos de las marcas
from pydantic import BaseModel, Field


class MarcaEntrada(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50)


class Marca(MarcaEntrada):
    id_marca: int