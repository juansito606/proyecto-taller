# schemas/usuario.py - Valida los datos de usuarios y roles
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class UsuarioEntrada(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    usuario: str = Field(..., pattern=r"^[a-z0-9_]{3,30}$", description="Minúsculas, números o _")
    contrasena: Optional[str] = Field(None, min_length=6, max_length=50,
                                      description="Obligatoria al crear. Al editar, vacía = no cambia")
    id_rol: int
    activo: Literal["S", "N"] = "S"


class Usuario(BaseModel):
    id_usuario: int
    nombre: str
    usuario: str
    id_rol: int
    rol: str
    activo: str
    fecha_creacion: datetime


class Rol(BaseModel):
    id_rol: int
    nombre: str
    descripcion: Optional[str] = None

    