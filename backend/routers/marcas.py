# routers/marcas.py - Marcas de repuestos: todos las ven; admin y vendedora las crean y editan
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.marca import Marca, MarcaEntrada
from services import marca_service as servicio
from services import actividad_service as actividad
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/marcas", tags=["Marcas"])
ADMIN_O_VENDEDOR = Depends(requiere_rol("ADMINISTRADOR", "VENDEDOR"))
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
def crear(datos: MarcaEntrada, usuario=ADMIN_O_VENDEDOR):
    marca = servicio.crear(datos)
    actividad.registrar(usuario["id_usuario"], "INVENTARIO", "creó una nueva marca de repuestos", marca["nombre"])
    return marca


@router.put("/{id_marca}", response_model=Marca)
def actualizar(id_marca: int, datos: MarcaEntrada, usuario=ADMIN_O_VENDEDOR):
    marca = servicio.actualizar(id_marca, datos)
    if not marca:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    actividad.registrar(usuario["id_usuario"], "EDICION", "editó una marca de repuestos", marca["nombre"])
    return marca


@router.delete("/{id_marca}")
def eliminar(id_marca: int, usuario=SOLO_ADMIN):
    antes = servicio.obtener(id_marca)
    if not antes or not servicio.eliminar(id_marca):
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    actividad.registrar(usuario["id_usuario"], "ELIMINACION", "borró una marca de repuestos", antes["nombre"])
    return {"mensaje": "Marca eliminada"}



