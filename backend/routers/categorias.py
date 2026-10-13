# routers/categorias.py - Categorías de repuestos: todos las ven; admin y vendedora las crean y editan
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.categoria import Categoria, CategoriaEntrada
from services import categoria_service as servicio
from services import actividad_service as actividad
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/categorias", tags=["Categorías"])
ADMIN_O_VENDEDOR = Depends(requiere_rol("ADMINISTRADOR", "VENDEDOR"))
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
def crear(datos: CategoriaEntrada, usuario=ADMIN_O_VENDEDOR):
    categoria = servicio.crear(datos)
    actividad.registrar(usuario["id_usuario"], "INVENTARIO", "creó una nueva categoría de repuestos", categoria["nombre"])
    return categoria


@router.put("/{id_categoria}", response_model=Categoria)
def actualizar(id_categoria: int, datos: CategoriaEntrada, usuario=ADMIN_O_VENDEDOR):
    categoria = servicio.actualizar(id_categoria, datos)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    actividad.registrar(usuario["id_usuario"], "EDICION", "editó una categoría de repuestos", categoria["nombre"])
    return categoria


@router.delete("/{id_categoria}")
def eliminar(id_categoria: int, usuario=SOLO_ADMIN):
    antes = servicio.obtener(id_categoria)
    if not antes or not servicio.eliminar(id_categoria):
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    actividad.registrar(usuario["id_usuario"], "ELIMINACION", "borró una categoría de repuestos", antes["nombre"])
    return {"mensaje": "Categoría eliminada"}

