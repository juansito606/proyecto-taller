# routers/reportes.py - Dashboard y reportes (solo administrador)
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query

from services import reporte_service as servicio
from services.auth_service import requiere_rol

SOLO_ADMIN = Depends(requiere_rol("ADMINISTRADOR"))
router_dashboard = APIRouter(prefix="/api/dashboard", tags=["Dashboard y reportes"])
router = APIRouter(prefix="/api/reportes", tags=["Dashboard y reportes"])


@router_dashboard.get("")
def dashboard(usuario=SOLO_ADMIN):
    return servicio.dashboard()


@router.get("/ventas-por-mes")
def ventas_por_mes(usuario=SOLO_ADMIN):
    return servicio.ventas_por_mes()


@router.get("/repuestos-mas-vendidos")
def repuestos_mas_vendidos(limite: int = Query(10, ge=1, le=50), usuario=SOLO_ADMIN):
    return servicio.repuestos_mas_vendidos(limite)


@router.get("/trabajos-por-trabajador")
def trabajos_por_trabajador(usuario=SOLO_ADMIN):
    return servicio.trabajos_por_trabajador()


@router.get("/flujo-caja")
def flujo_caja(desde: Optional[date] = None, hasta: Optional[date] = None, usuario=SOLO_ADMIN):
    return servicio.flujo_caja(desde, hasta)

