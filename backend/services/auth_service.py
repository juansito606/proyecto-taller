# services/auth_service.py - Lógica del login
import secrets
import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database.conexion import obtener_conexion

# Sesiones activas: token -> datos del usuario (se guardan en memoria)
SESIONES = {}
seguridad = HTTPBearer(auto_error=False)


def iniciar_sesion(usuario: str, contrasena: str):
    with obtener_conexion() as conexion:
        with conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.id_usuario, u.nombre, u.usuario, u.contrasena, u.activo, r.nombre
                FROM usuarios u
                JOIN roles r ON r.id_rol = u.id_rol
                WHERE u.usuario = :usuario
                """,
                {"usuario": usuario},
            )
            fila = cursor.fetchone()

    # 401: usuario no existe o contraseña incorrecta (mismo mensaje por seguridad)
    if fila is None or not bcrypt.checkpw(contrasena.encode(), fila[3].encode()):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    # 403: el administrador le quitó el acceso
    if fila[4] != "S":
        raise HTTPException(status_code=403, detail="El usuario está inactivo")

    datos = {"id_usuario": fila[0], "nombre": fila[1], "usuario": fila[2], "rol": fila[5]}
    token = secrets.token_hex(32)
    SESIONES[token] = datos
    return {"token": token, "usuario": datos}


def usuario_actual(credenciales: HTTPAuthorizationCredentials = Depends(seguridad)):
    """Revisa el token y que el usuario siga activo en Oracle."""
    if credenciales is None or credenciales.credentials not in SESIONES:
        raise HTTPException(status_code=401, detail="Debe iniciar sesión")
    datos = SESIONES[credenciales.credentials]

    # Si el administrador lo desactivó, se le cierra la sesión de inmediato
    with obtener_conexion() as conexion, conexion.cursor() as cursor:
        cursor.execute("SELECT activo FROM usuarios WHERE id_usuario = :id",
                       {"id": datos["id_usuario"]})
        fila = cursor.fetchone()
    if fila is None or fila[0] != "S":
        SESIONES.pop(credenciales.credentials, None)
        raise HTTPException(status_code=401, detail="Su usuario fue desactivado. Contacte al administrador")
    return datos


def requiere_rol(*roles):
    """Permite el acceso solo a ciertos roles, por ejemplo ADMINISTRADOR."""
    def verificar(usuario=Depends(usuario_actual)):
        if usuario["rol"] not in roles:
            raise HTTPException(status_code=403, detail="No tiene permiso para esta acción")
        return usuario
    return verificar


def cerrar_sesion(token: str):
    SESIONES.pop(token, None)

    