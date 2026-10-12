# routers/categorias.py - Direcciones de las categorías
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.categoria import Categoria, CategoriaEntrada
from services import categoria_service as servicio
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/categorias", tags=["Categorías"])
SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))


@router.get("", response_model=List[Categoria])
def listar(buscar: Optional[str] = None, usuario=Depends(usuario_actual)):
    return servicio.listar(buscar)


@router.get("/{id_categoria}", response_model=Categoria)
def obtener(id_categoria: int, usuario=Depends(usuario_actual)):
    categoria = servicio.obtener(id_categoria)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria


@router.post("", response_model=Categoria, status_code=201)
def crear(datos: CategoriaEntrada, usuario=SOLO_ADMIN):
    return servicio.crear(datos)


@router.put("/{id_categoria}", response_model=Categoria)
def actualizar(id_categoria: int, datos: CategoriaEntrada, usuario=SOLO_ADMIN):
    categoria = servicio.actualizar(id_categoria, datos)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria


@router.delete("/{id_categoria}")
def eliminar(id_categoria: int, usuario=SOLO_ADMIN):
    if not servicio.eliminar(id_categoria):
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"mensaje": "Categoría eliminada"}

