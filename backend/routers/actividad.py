# routers/actividad.py - Actividad del taller (solo el administrador la ve)
from fastapi import APIRouter, Depends

from services import actividad_service as servicio
from services.auth_service import requiere_rol

router = APIRouter(prefix="/api/actividad", tags=["Actividad del taller"])


@router.get("")
def listar(despues_de: int = 0, limite: int = 40, usuario=Depends(requiere_rol("ADMINISTRADOR"))):
    return servicio.listar(despues_de, min(limite, 100))

