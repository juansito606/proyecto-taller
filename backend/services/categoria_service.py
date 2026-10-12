# services/categoria_service.py - SQL de las categorías
from database.conexion import obtener_conexion, a_diccionarios

COLUMNAS = "id_categoria, nombre, descripcion"


def listar(buscar=None):
    sql = f"SELECT {COLUMNAS} FROM categorias"
    params = {}
    if buscar:
        sql += " WHERE UPPER(nombre) LIKE UPPER(:buscar)"
        params["buscar"] = f"%{buscar}%"
    sql += " ORDER BY nombre"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        return a_diccionarios(cur)


def obtener(id_categoria):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(f"SELECT {COLUMNAS} FROM categorias WHERE id_categoria = :id",
                    {"id": id_categoria})
        filas = a_diccionarios(cur)
        return filas[0] if filas else None


def crear(datos):
    with obtener_conexion() as con, con.cursor() as cur:
        nuevo_id = cur.var(int)
        cur.execute(
            """INSERT INTO categorias (nombre, descripcion)
               VALUES (:nombre, :descripcion)
               RETURNING id_categoria INTO :nuevo_id""",
            {**datos.model_dump(), "nuevo_id": nuevo_id},
        )
        con.commit()
        return obtener(nuevo_id.getvalue()[0])


def actualizar(id_categoria, datos):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(
            """UPDATE categorias SET nombre = :nombre, descripcion = :descripcion
               WHERE id_categoria = :id""",
            {**datos.model_dump(), "id": id_categoria},
        )
        con.commit()
        return obtener(id_categoria) if cur.rowcount else None


def eliminar(id_categoria):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("DELETE FROM categorias WHERE id_categoria = :id", {"id": id_categoria})
        con.commit()
        return cur.rowcount > 0

    