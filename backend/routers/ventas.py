# routers/ventas.py - Ventas y servicios (admin y vendedor; anular solo admin) + bitácora
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.venta import VentaEntrada
from services import venta_service as servicio
from services import actividad_service as actividad
from services.actividad_service import moto, pesos
from services.auth_service import requiere_rol

router = APIRouter(prefix="/api/ventas", tags=["Ventas y servicios"])
ADMIN_O_VENDEDOR = Depends(requiere_rol("ADMINISTRADOR", "VENDEDOR"))
SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))


def _quien(v):
    if v["placa"]:
        return "A la " + moto(v["marca_moto"], v["modelo_moto"], v["placa"], v["apodo"], v["cliente"])
    return f"A {v['cliente']}" if v["cliente"] else "Venta de mostrador"


@router.get("")
def listar(buscar: Optional[str] = None, desde: Optional[date] = None, hasta: Optional[date] = None,
           usuario=ADMIN_O_VENDEDOR):
    return servicio.listar(buscar, desde, hasta)


@router.get("/{id_venta}")
def obtener(id_venta: int, usuario=ADMIN_O_VENDEDOR):
    venta = servicio.obtener(id_venta)
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


@router.post("", status_code=201)
def registrar(datos: VentaEntrada, usuario=ADMIN_O_VENDEDOR):
    uid = usuario["id_usuario"]
    venta = servicio.crear(datos, uid)

    partes = [f"{i['repuesto']} ×{i['cantidad']} ({pesos(i['subtotal'])})" for i in venta["items"]]
    if venta["id_trabajo"]:
        partes.append(f"mano de obra «{venta['trabajo']}» ({pesos(venta['mano_obra'])})")
    if venta["items"] and venta["id_trabajo"]:
        accion = "vendió repuestos + mano de obra"
    elif venta["id_trabajo"]:
        accion = "registró una venta de solo mano de obra"
    else:
        accion = "vendió repuestos"
    actividad.registrar(uid, "VENTA", f"{accion} (venta #{venta['id_venta']})",
                        f"{_quien(venta)}: {' + '.join(partes)} · Total {pesos(venta['total'])}", venta["total"])
    if venta["id_trabajo"]:
        actividad.registrar(uid, "ASIGNACION", f"le asignó un trabajo a {venta['mecanico']}",
                            f"«{venta['trabajo']}» · {_quien(venta)} · Mano de obra {pesos(venta['mano_obra'])}",
                            venta["mano_obra"])
    return venta


@router.delete("/{id_venta}")
def anular(id_venta: int, usuario=SOLO_ADMIN):
    venta = servicio.obtener(id_venta)
    if not venta or not servicio.anular(id_venta):
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    actividad.registrar(usuario["id_usuario"], "ANULACION", f"anuló la venta #{id_venta}",
                        f"{_quien(venta)} · Total {pesos(venta['total'])} · Los repuestos volvieron al inventario",
                        venta["total"])
    return {"mensaje": "Venta anulada: los repuestos volvieron al inventario"}

