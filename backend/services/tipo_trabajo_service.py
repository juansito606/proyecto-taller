# services/tipo_trabajo_service.py - SQL de los tipos de trabajo
from database.conexion import obtener_conexion, a_diccionarios

SELECT_TIPOS = """
    SELECT tt.id_tipo, tt.nombre, tt.descripcion, tt.precio_sugerido,
           (SELECT COUNT(*) FROM trabajos t WHERE t.id_tipo = tt.id_tipo) AS trabajos
    FROM tipos_trabajo tt
"""


def listar(buscar=None):
    sql = SELECT_TIPOS
    params = {}
    if buscar:
        sql += " WHERE UPPER(tt.nombre) LIKE UPPER(:buscar)"
        params["buscar"] = f"%{buscar}%"
    sql += " ORDER BY tt.nombre"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        return a_diccionarios(cur)


def obtener(id_tipo):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(SELECT_TIPOS + " WHERE tt.id_tipo = :id", {"id": id_tipo})
        filas = a_diccionarios(cur)
        return filas[0] if filas else None


def crear(datos):
    with obtener_conexion() as con, con.cursor() as cur:
        nuevo_id = cur.var(int)
        cur.execute(
            """INSERT INTO tipos_trabajo (nombre, descripcion, precio_sugerido)
               VALUES (:nombre, :descripcion, :precio_sugerido)
               RETURNING id_tipo INTO :nuevo_id""",
            {**datos.model_dump(), "nuevo_id": nuevo_id},
        )
        con.commit()
        return obtener(nuevo_id.getvalue()[0])


def actualizar(id_tipo, datos):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(
            """UPDATE tipos_trabajo SET nombre = :nombre, descripcion = :descripcion,
                      precio_sugerido = :precio_sugerido
               WHERE id_tipo = :id""",
            {**datos.model_dump(), "id": id_tipo},
        )
        con.commit()
        return obtener(id_tipo) if cur.rowcount else None


def eliminar(id_tipo):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("DELETE FROM tipos_trabajo WHERE id_tipo = :id", {"id": id_tipo})
        con.commit()
        return cur.rowcount > 0