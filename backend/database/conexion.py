# conexion.py - Conexión a Oracle
import os
import oracledb
from dotenv import load_dotenv

load_dotenv()  # Lee el archivo .env


def obtener_conexion():
    """Abre una conexión a Oracle con los datos del archivo .env"""
    return oracledb.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        dsn=os.getenv("DB_DSN"),
    )
    