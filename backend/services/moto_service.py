# services/moto_service.py - SQL de las motos
from database.conexion import obtener_conexion, a_diccionarios

SELECT_MOTOS = """
    SELECT m.id_moto, m.placa, m.marca, m.modelo, m.anio, m.apodo,
           m.id_cliente, c.nombre AS cliente
    FROM motos_cliente m
    JOIN clientes c ON c.id_cliente = m.id_cliente
"""


def listar(buscar=None, id_cliente=None):
    sql = SELECT_MOTOS + " WHERE 1 = 1"
    params = {}
    if buscar:
        sql += " AND (UPPER(m.placa) LIKE UPPER(:buscar) OR UPPER(m.apodo) LIKE UPPER(:buscar))"
        params["buscar"] = f"%{buscar}%"
    if id_cliente:
        sql += " AND m.id_cliente = :id_cliente"
        params["id_cliente"] = id_cliente
    sql += " ORDER BY m.placa"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        return a_diccionarios(cur)


def obtener(id_moto):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(SELECT_MOTOS + " WHERE m.id_moto = :id", {"id": id_moto})
        filas = a_diccionarios(cur)
        return filas[0] if filas else None


def crear(datos):
    with obtener_conexion() as con, con.cursor() as cur:
        nuevo_id = cur.var(int)
        cur.execute(
            """INSERT INTO motos_cliente (placa, marca, modelo, anio, apodo, id_cliente)
               VALUES (:placa, :marca, :modelo, :anio, :apodo, :id_cliente)
               RETURNING id_moto INTO :nuevo_id""",
            {**datos.model_dump(), "nuevo_id": nuevo_id},
        )
        con.commit()
        return obtener(nuevo_id.getvalue()[0])


def actualizar(id_moto, datos):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(
            """UPDATE motos_cliente SET placa = :placa, marca = :marca, modelo = :modelo,
                      anio = :anio, apodo = :apodo, id_cliente = :id_cliente
               WHERE id_moto = :id""",
            {**datos.model_dump(), "id": id_moto},
        )
        con.commit()
        return obtener(id_moto) if cur.rowcount else None


def eliminar(id_moto):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("DELETE FROM motos_cliente WHERE id_moto = :id", {"id": id_moto})
        con.commit()
        return cur.rowcount > 0

    