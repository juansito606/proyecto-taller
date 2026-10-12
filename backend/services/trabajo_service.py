# services/trabajo_service.py - SQL de los trabajos del taller
from database.conexion import obtener_conexion, a_diccionarios

SELECT_TRABAJOS = """
    SELECT t.id_trabajo, t.id_moto, m.placa, m.apodo, c.nombre AS cliente,
           t.id_usuario, u.nombre AS trabajador, t.descripcion, t.fecha, t.costo, t.estado,
           t.fecha_terminado
    FROM trabajos t
    JOIN motos_cliente m ON m.id_moto    = t.id_moto
    JOIN clientes c      ON c.id_cliente = m.id_cliente
    JOIN usuarios u      ON u.id_usuario = t.id_usuario
"""


def listar(buscar=None, estado=None, id_usuario=None, desde=None, hasta=None):
    sql = SELECT_TRABAJOS + " WHERE 1 = 1"
    params = {}
    if buscar:
        sql += " AND (UPPER(m.placa) LIKE UPPER(:buscar) OR UPPER(m.apodo) LIKE UPPER(:buscar))"
        params["buscar"] = f"%{buscar}%"
    if estado:
        sql += " AND t.estado = :estado"
        params["estado"] = estado
    if id_usuario:
        sql += " AND t.id_usuario = :id_usuario"
        params["id_usuario"] = id_usuario
    if desde:
        sql += " AND TRUNC(t.fecha) >= :desde"
        params["desde"] = desde
    if hasta:
        sql += " AND TRUNC(t.fecha) <= :hasta"
        params["hasta"] = hasta
    sql += " ORDER BY t.fecha DESC"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        return a_diccionarios(cur)


def obtener(id_trabajo):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(SELECT_TRABAJOS + " WHERE t.id_trabajo = :id", {"id": id_trabajo})
        filas = a_diccionarios(cur)
        return filas[0] if filas else None


def crear(datos):
    with obtener_conexion() as con, con.cursor() as cur:
        nuevo_id = cur.var(int)
        cur.execute(
            """INSERT INTO trabajos (id_moto, id_usuario, descripcion, fecha, costo, estado, fecha_terminado)
               VALUES (:id_moto, :id_usuario, :descripcion, NVL(:fecha, SYSDATE), :costo, :estado,
                       CASE WHEN :estado = 'TERMINADO' THEN SYSDATE END)
               RETURNING id_trabajo INTO :nuevo_id""",
            {**datos.model_dump(), "nuevo_id": nuevo_id},
        )
        con.commit()
        return obtener(nuevo_id.getvalue()[0])


def actualizar(id_trabajo, datos):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(
            """UPDATE trabajos SET id_moto = :id_moto, id_usuario = :id_usuario,
                      descripcion = :descripcion, fecha = NVL(:fecha, fecha),
                      costo = :costo, estado = :estado,
                      fecha_terminado = CASE WHEN :estado = 'TERMINADO'
                                             THEN NVL(fecha_terminado, SYSDATE) END
               WHERE id_trabajo = :id""",
            {**datos.model_dump(), "id": id_trabajo},
        )
        con.commit()
        return obtener(id_trabajo) if cur.rowcount else None


def eliminar(id_trabajo):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("DELETE FROM trabajos WHERE id_trabajo = :id", {"id": id_trabajo})
        con.commit()
        return cur.rowcount > 0


    