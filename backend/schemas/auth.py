# schemas/auth.py - Valida los datos del login
from pydantic import BaseModel, Field


class LoginEntrada(BaseModel):
    usuario: str = Field(..., min_length=3, max_length=30)
    contrasena: str = Field(..., min_length=4, max_length=50)


class UsuarioSesion(BaseModel):
    id_usuario: int
    nombre: str
    usuario: str
    rol: str


class LoginRespuesta(BaseModel):
    token: str
    usuario: UsuarioSesion

    