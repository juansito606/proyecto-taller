# routers/trabajos.py - Admin y vendedor asignan; el mecánico ve y avanza solo los suyos (todo queda en la bitácora)
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from schemas.trabajo import Trabajo, TrabajoEntrada
from services import trabajo_service as servicio
from services import actividad_service as actividad
from services.actividad_service import moto, pesos
from services.auth_service import usuario_actual, requiere_rol

router = APIRouter(prefix="/api/trabajos", tags=["Trabajos"])
PERSONAL = Depends(requiere_rol("ADMINISTRADOR", "VENDEDOR", "TRABAJADOR"))
SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))


def _es_trabajador(usuario):
    return usuario["rol"] == "TRABAJADOR"


def _resumen(t):
    """-> '«Cambio de aceite» a la moto Hero Hunk 125 (JCI56I «Rodolfa») de Juan Izquierdo'"""
    return f"«{t['descripcion']}» a la " + moto(t["marca_moto"], t["modelo_moto"], t["placa"], t["apodo"], t["cliente"])


def _registrar_cambio(usuario, antes, despues):
    uid = usuario["id_usuario"]
    propio = despues["id_usuario"] == uid
    if antes["estado"] != despues["estado"] and despues["estado"] == "TERMINADO":
        repuestos = (f" · Repuestos vendidos a esa moto: {despues['repuestos']} ({pesos(despues['valor_repuestos'])})"
                     if despues["repuestos"] else " · Sin repuestos")
        accion = "terminó un trabajo" if propio else f"marcó como terminado el trabajo de {despues['trabajador']}"
        actividad.registrar(uid, "TERMINADO", accion,
                            f"{_resumen(despues)} · Mano de obra {pesos(despues['costo'])}{repuestos}", despues["costo"])
    elif antes["estado"] != despues["estado"]:
        if propio and despues["estado"] == "EN PROCESO":
            accion = "empezó a trabajar en una moto"
        else:
            accion = f"pasó a {despues['estado']} el trabajo de {despues['trabajador']}"
        actividad.registrar(uid, "AVANCE", accion, _resumen(despues))
    elif antes["id_usuario"] != despues["id_usuario"]:
        actividad.registrar(uid, "ASIGNACION", f"le pasó un trabajo de {antes['trabajador']} a {despues['trabajador']}",
                            f"{_resumen(despues)} · Mano de obra {pesos(despues['costo'])}", despues["costo"])
    else:
        actividad.registrar(uid, "EDICION", "editó un trabajo",
                            f"{_resumen(despues)} · Mano de obra {pesos(despues['costo'])}")


@router.get("", response_model=List[Trabajo])
def listar(buscar: Optional[str] = None, estado: Optional[str] = None,
           id_usuario: Optional[int] = None, desde: Optional[date] = None,
           hasta: Optional[date] = None, usuario=Depends(usuario_actual)):
    if _es_trabajador(usuario):          # el mecánico solo ve lo suyo
        id_usuario = usuario["id_usuario"]
    return servicio.listar(buscar, estado, id_usuario, desde, hasta)


@router.get("/{id_trabajo}", response_model=Trabajo)
def obtener(id_trabajo: int, usuario=Depends(usuario_actual)):
    trabajo = servicio.obtener(id_trabajo)
    if not trabajo:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if _es_trabajador(usuario) and trabajo["id_usuario"] != usuario["id_usuario"]:
        raise HTTPException(status_code=403, detail="Solo puede ver sus propios trabajos")
    return trabajo


@router.post("", response_model=Trabajo, status_code=201)
def crear(datos: TrabajoEntrada, usuario=PERSONAL):
    if _es_trabajador(usuario):
        datos.id_usuario = usuario["id_usuario"]
    elif datos.id_usuario is None:
        raise HTTPException(status_code=400, detail="Debe indicar el mecánico (id_usuario)")
    nuevo = servicio.crear(datos)
    detalle = f"{_resumen(nuevo)} · Mano de obra {pesos(nuevo['costo'])}"
    if _es_trabajador(usuario):
        actividad.registrar(usuario["id_usuario"], "ORDEN", "registró una nueva orden de trabajo", detalle, nuevo["costo"])
    else:
        actividad.registrar(usuario["id_usuario"], "ASIGNACION", f"le asignó un trabajo a {nuevo['trabajador']}",
                            detalle, nuevo["costo"])
    return nuevo


@router.put("/{id_trabajo}", response_model=Trabajo)
def actualizar(id_trabajo: int, datos: TrabajoEntrada, usuario=PERSONAL):
    actual = servicio.obtener(id_trabajo)
    if not actual:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if _es_trabajador(usuario):
        if actual["id_usuario"] != usuario["id_usuario"]:
            raise HTTPException(status_code=403, detail="Solo puede modificar sus propios trabajos")
        datos.id_usuario = usuario["id_usuario"]
    elif datos.id_usuario is None:
        datos.id_usuario = actual["id_usuario"]
    nuevo = servicio.actualizar(id_trabajo, datos)
    if nuevo:
        _registrar_cambio(usuario, actual, nuevo)
    return nuevo


@router.delete("/{id_trabajo}")
def eliminar(id_trabajo: int, usuario=SOLO_ADMIN):
    antes = servicio.obtener(id_trabajo)
    if not antes or not servicio.eliminar(id_trabajo):
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    actividad.registrar(usuario["id_usuario"], "ELIMINACION", f"eliminó un trabajo de {antes['trabajador']}", _resumen(antes))
    return {"mensaje": "Trabajo eliminado"}


