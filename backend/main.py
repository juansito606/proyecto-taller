# main.py - Punto de entrada de la API
import oracledb
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from database.conexion import obtener_conexion
from routers import auth, categorias, marcas, clientes, motos, repuestos, trabajos

app = FastAPI(title="API Taller de Motos")

# Módulos de la API
app.include_router(auth.router)
app.include_router(categorias.router)
app.include_router(marcas.router)
app.include_router(clientes.router)
app.include_router(motos.router)
app.include_router(repuestos.router)
app.include_router(trabajos.router)

# Traduce los errores de Oracle a mensajes claros (no se muestran detalles técnicos)
ERRORES_ORACLE = {
    1: "Ya existe un registro con ese valor",
    1400: "Falta un dato obligatorio",
    2290: "Algún dato no cumple las reglas permitidas",
    2291: "El registro relacionado no existe",
    2292: "No se puede eliminar porque tiene registros asociados",
}


@app.exception_handler(oracledb.DatabaseError)
def error_oracle(request: Request, exc: oracledb.DatabaseError):
    codigo = getattr(exc.args[0], "code", None)
    if codigo in ERRORES_ORACLE:
        return JSONResponse(status_code=400, content={"detail": ERRORES_ORACLE[codigo]})
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})


@app.get("/")
def inicio():
    return {"mensaje": "API del taller funcionando"}


@app.get("/api/prueba-db")
def prueba_db():
    with obtener_conexion() as conexion:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM repuestos")
            total = cursor.fetchone()[0]
    return {"conexion": "ok", "total_repuestos": total}

