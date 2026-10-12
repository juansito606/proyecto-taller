# services/cliente_service.py - SQL de los clientes
from database.conexion import obtener_conexion, a_diccionarios

COLUMNAS = "id_cliente, documento, nombre, telefono, correo, fecha_registro"


def listar(buscar=None):
    sql = f"SELECT {COLUMNAS} FROM clientes"
    params = {}
    if buscar:
        sql += " WHERE UPPER(nombre) LIKE UPPER(:buscar) OR documento LIKE :buscar"
        params["buscar"] = f"%{buscar}%"
    sql += " ORDER BY nombre"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        return a_diccionarios(cur)


def obtener(id_cliente):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(f"SELECT {COLUMNAS} FROM clientes WHERE id_cliente = :id", {"id": id_cliente})
        filas = a_diccionarios(cur)
        return filas[0] if filas else None


def crear(datos):
    with obtener_conexion() as con, con.cursor() as cur:
        nuevo_id = cur.var(int)
        cur.execute(
            """INSERT INTO clientes (documento, nombre, telefono, correo)
               VALUES (:documento, :nombre, :telefono, :correo)
               RETURNING id_cliente INTO :nuevo_id""",
            {**datos.model_dump(), "nuevo_id": nuevo_id},
        )
        con.commit()
        return obtener(nuevo_id.getvalue()[0])


def actualizar(id_cliente, datos):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(
            """UPDATE clientes SET documento = :documento, nombre = :nombre,
                      telefono = :telefono, correo = :correo
               WHERE id_cliente = :id""",
            {**datos.model_dump(), "id": id_cliente},
        )
        con.commit()
        return obtener(id_cliente) if cur.rowcount else None


def eliminar(id_cliente):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("DELETE FROM clientes WHERE id_cliente = :id", {"id": id_cliente})
        con.commit()
        return cur.rowcount > 0


    