# routers/auth.py - Direcciones del login
from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials

from schemas.auth import LoginEntrada, LoginRespuesta, UsuarioSesion
from services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=LoginRespuesta)
def login(datos: LoginEntrada):
    return auth_service.iniciar_sesion(datos.usuario, datos.contrasena)


@router.get("/me", response_model=UsuarioSesion)
def quien_soy(usuario=Depends(auth_service.usuario_actual)):
    return usuario


@router.post("/logout")
def logout(credenciales: HTTPAuthorizationCredentials = Depends(auth_service.seguridad)):
    if credenciales:
        auth_service.cerrar_sesion(credenciales.credentials)
    return {"mensaje": "Sesión cerrada"}

