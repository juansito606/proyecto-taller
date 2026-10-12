# services/marca_service.py - SQL de las marcas
from database.conexion import obtener_conexion, a_diccionarios


def listar(buscar=None):
    sql = "SELECT id_marca, nombre FROM marcas"
    params = {}
    if buscar:
        sql += " WHERE UPPER(nombre) LIKE UPPER(:buscar)"
        params["buscar"] = f"%{buscar}%"
    sql += " ORDER BY nombre"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        return a_diccionarios(cur)


def obtener(id_marca):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("SELECT id_marca, nombre FROM marcas WHERE id_marca = :id", {"id": id_marca})
        filas = a_diccionarios(cur)
        return filas[0] if filas else None


def crear(datos):
    with obtener_conexion() as con, con.cursor() as cur:
        nuevo_id = cur.var(int)
        cur.execute("INSERT INTO marcas (nombre) VALUES (:nombre) RETURNING id_marca INTO :nuevo_id",
                    {**datos.model_dump(), "nuevo_id": nuevo_id})
        con.commit()
        return obtener(nuevo_id.getvalue()[0])


def actualizar(id_marca, datos):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("UPDATE marcas SET nombre = :nombre WHERE id_marca = :id",
                    {**datos.model_dump(), "id": id_marca})
        con.commit()
        return obtener(id_marca) if cur.rowcount else None


def eliminar(id_marca):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("DELETE FROM marcas WHERE id_marca = :id", {"id": id_marca})
        con.commit()
        return cur.rowcount > 0

    