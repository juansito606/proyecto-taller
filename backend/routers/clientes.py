# routers/clientes.py - Direcciones de los clientes
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.cliente import Cliente, ClienteEntrada
from services import cliente_service as servicio
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/clientes", tags=["Clientes"])
ADMIN_O_VENDEDOR = Depends(requiere_rol("ADMINISTRADOR", "VENDEDOR"))
SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))


@router.get("", response_model=List[Cliente])
def listar(buscar: Optional[str] = None, usuario=Depends(usuario_actual)):
    return servicio.listar(buscar)


@router.get("/{id_cliente}", response_model=Cliente)
def obtener(id_cliente: int, usuario=Depends(usuario_actual)):
    cliente = servicio.obtener(id_cliente)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("", response_model=Cliente, status_code=201)
def crear(datos: ClienteEntrada, usuario=ADMIN_O_VENDEDOR):
    return servicio.crear(datos)


@router.put("/{id_cliente}", response_model=Cliente)
def actualizar(id_cliente: int, datos: ClienteEntrada, usuario=ADMIN_O_VENDEDOR):
    cliente = servicio.actualizar(id_cliente, datos)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.delete("/{id_cliente}")
def eliminar(id_cliente: int, usuario=SOLO_ADMIN):
    if not servicio.eliminar(id_cliente):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"mensaje": "Cliente eliminado"}


