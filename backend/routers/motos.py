# routers/motos.py - Direcciones de las motos de los clientes
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.moto import Moto, MotoEntrada
from services import moto_service as servicio
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/motos", tags=["Motos de clientes"])
ADMIN_O_VENDEDOR = Depends(requiere_rol("ADMINISTRADOR", "VENDEDOR"))
SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))


@router.get("", response_model=List[Moto])
def listar(buscar: Optional[str] = None, id_cliente: Optional[int] = None,
           usuario=Depends(usuario_actual)):
    return servicio.listar(buscar, id_cliente)


@router.get("/{id_moto}", response_model=Moto)
def obtener(id_moto: int, usuario=Depends(usuario_actual)):
    moto = servicio.obtener(id_moto)
    if not moto:
        raise HTTPException(status_code=404, detail="Moto no encontrada")
    return moto


@router.post("", response_model=Moto, status_code=201)
def crear(datos: MotoEntrada, usuario=ADMIN_O_VENDEDOR):
    return servicio.crear(datos)


@router.put("/{id_moto}", response_model=Moto)
def actualizar(id_moto: int, datos: MotoEntrada, usuario=ADMIN_O_VENDEDOR):
    moto = servicio.actualizar(id_moto, datos)
    if not moto:
        raise HTTPException(status_code=404, detail="Moto no encontrada")
    return moto


@router.delete("/{id_moto}")
def eliminar(id_moto: int, usuario=SOLO_ADMIN):
    if not servicio.eliminar(id_moto):
        raise HTTPException(status_code=404, detail="Moto no encontrada")
    return {"mensaje": "Moto eliminada"}

