# main.py - Punto de entrada de la API
from fastapi import FastAPI
from database.conexion import obtener_conexion
from routers import auth

app = FastAPI(title="API Taller de Motos")

app.include_router(auth.router)


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

