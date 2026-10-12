# routers/marcas.py - Direcciones de las marcas
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.marca import Marca, MarcaEntrada
from services import marca_service as servicio
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/marcas", tags=["Marcas"])
SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))


@router.get("", response_model=List[Marca])
def listar(buscar: Optional[str] = None, usuario=Depends(usuario_actual)):
    return servicio.listar(buscar)


@router.get("/{id_marca}", response_model=Marca)
def obtener(id_marca: int, usuario=Depends(usuario_actual)):
    marca = servicio.obtener(id_marca)
    if not marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    return marca


@router.post("", response_model=Marca, status_code=201)
def crear(datos: MarcaEntrada, usuario=SOLO_ADMIN):
    return servicio.crear(datos)


@router.put("/{id_marca}", response_model=Marca)
def actualizar(id_marca: int, datos: MarcaEntrada, usuario=SOLO_ADMIN):
    marca = servicio.actualizar(id_marca, datos)
    if not marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    return marca


@router.delete("/{id_marca}")
def eliminar(id_marca: int, usuario=SOLO_ADMIN):
    if not servicio.eliminar(id_marca):
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    return {"mensaje": "Marca eliminada"}
