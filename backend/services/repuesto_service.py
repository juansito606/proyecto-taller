# services/repuesto_service.py - SQL de los repuestos (inventario)
from database.conexion import obtener_conexion, a_diccionarios

SELECT_REPUESTOS = """
    SELECT r.id_repuesto, r.referencia, r.nombre, r.id_categoria, c.nombre AS categoria,
           r.id_marca, m.nombre AS marca, r.precio, r.stock, r.stock_minimo
    FROM repuestos r
    JOIN categorias c ON c.id_categoria = r.id_categoria
    JOIN marcas m     ON m.id_marca     = r.id_marca
"""


def _marcar_stock_bajo(filas):
    for fila in filas:
        fila["stock_bajo"] = fila["stock"] <= fila["stock_minimo"]
    return filas


def listar(buscar=None, id_categoria=None, id_marca=None, solo_stock_bajo=False):
    sql = SELECT_REPUESTOS + " WHERE 1 = 1"
    params = {}
    if buscar:
        sql += " AND (UPPER(r.nombre) LIKE UPPER(:buscar) OR UPPER(r.referencia) LIKE UPPER(:buscar))"
        params["buscar"] = f"%{buscar}%"
    if id_categoria:
        sql += " AND r.id_categoria = :id_categoria"
        params["id_categoria"] = id_categoria
    if id_marca:
        sql += " AND r.id_marca = :id_marca"
        params["id_marca"] = id_marca
    if solo_stock_bajo:
        sql += " AND r.stock <= r.stock_minimo"
    sql += " ORDER BY r.nombre"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        return _marcar_stock_bajo(a_diccionarios(cur))


def obtener(id_repuesto):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(SELECT_REPUESTOS + " WHERE r.id_repuesto = :id", {"id": id_repuesto})
        filas = _marcar_stock_bajo(a_diccionarios(cur))
        return filas[0] if filas else None


def crear(datos):
    with obtener_conexion() as con, con.cursor() as cur:
        nuevo_id = cur.var(int)
        cur.execute(
            """INSERT INTO repuestos (referencia, nombre, id_categoria, id_marca, precio, stock, stock_minimo)
               VALUES (:referencia, :nombre, :id_categoria, :id_marca, :precio, :stock, :stock_minimo)
               RETURNING id_repuesto INTO :nuevo_id""",
            {**datos.model_dump(), "nuevo_id": nuevo_id},
        )
        con.commit()
        return obtener(nuevo_id.getvalue()[0])


def actualizar(id_repuesto, datos):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(
            """UPDATE repuestos SET referencia = :referencia, nombre = :nombre,
                      id_categoria = :id_categoria, id_marca = :id_marca, precio = :precio,
                      stock = :stock, stock_minimo = :stock_minimo
               WHERE id_repuesto = :id""",
            {**datos.model_dump(), "id": id_repuesto},
        )
        con.commit()
        return obtener(id_repuesto) if cur.rowcount else None


def eliminar(id_repuesto):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("DELETE FROM repuestos WHERE id_repuesto = :id", {"id": id_repuesto})
        con.commit()
        return cur.rowcount > 0

    