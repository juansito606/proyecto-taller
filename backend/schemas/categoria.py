# schemas/categoria.py - Valida los datos de las categorías
from typing import Optional
from pydantic import BaseModel, Field


class CategoriaEntrada(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50)
    descripcion: Optional[str] = Field(None, max_length=150)


class Categoria(CategoriaEntrada):
    id_categoria: int

    