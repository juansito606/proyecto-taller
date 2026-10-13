# services/venta_service.py - Ventas: trabajo + repuestos en UNA sola transacción
from fastapi import HTTPException

from database.conexion import obtener_conexion, a_diccionarios

SELECT_VENTAS = """
    SELECT v.id_venta, v.fecha, v.id_usuario, u.nombre AS registro,
           v.id_cliente, c.nombre AS cliente,
           v.id_moto, mc.placa, mc.apodo, mc.marca AS marca_moto, mc.modelo AS modelo_moto,
           v.id_trabajo, t.descripcion AS trabajo, t.costo AS mano_obra, t.estado AS estado_trabajo,
           tt.nombre AS tipo_trabajo, mec.nombre AS mecanico
    FROM ventas v
    JOIN usuarios u             ON u.id_usuario   = v.id_usuario
    LEFT JOIN clientes c        ON c.id_cliente   = v.id_cliente
    LEFT JOIN motos_cliente mc  ON mc.id_moto     = v.id_moto
    LEFT JOIN trabajos t        ON t.id_trabajo   = v.id_trabajo
    LEFT JOIN tipos_trabajo tt  ON tt.id_tipo     = t.id_tipo
    LEFT JOIN usuarios mec      ON mec.id_usuario = t.id_usuario
"""


def _agregar_items(cur, ventas):
    """Le pega a cada venta sus repuestos y calcula los totales."""
    if not ventas:
        return ventas
    binds = {f"v{i}": v["id_venta"] for i, v in enumerate(ventas)}
    marcadores = ", ".join(":" + k for k in binds)
    cur.execute(f"""
        SELECT m.id_venta, m.id_repuesto, r.nombre AS repuesto, m.cantidad,
               m.precio_unitario, m.cantidad * m.precio_unitario AS subtotal
        FROM movimientos m JOIN repuestos r ON r.id_repuesto = m.id_repuesto
        WHERE m.id_venta IN ({marcadores})
        ORDER BY m.id_movimiento""", binds)
    items = a_diccionarios(cur)
    for v in ventas:
        v["items"] = [i for i in items if i["id_venta"] == v["id_venta"]]
        v["total_repuestos"] = sum(i["subtotal"] for i in v["items"])
        v["mano_obra"] = v["mano_obra"] or 0
        v["total"] = v["total_repuestos"] + v["mano_obra"]
    return ventas


def listar(buscar=None, desde=None, hasta=None):
    sql = SELECT_VENTAS + " WHERE 1 = 1"
    params = {}
    if buscar:
        sql += """ AND (UPPER(c.nombre) LIKE UPPER(:buscar) OR UPPER(mc.placa) LIKE UPPER(:buscar)
                        OR UPPER(mc.apodo) LIKE UPPER(:buscar))"""
        params["buscar"] = f"%{buscar}%"
    if desde:
        sql += " AND TRUNC(v.fecha) >= :desde"
        params["desde"] = desde
    if hasta:
        sql += " AND TRUNC(v.fecha) <= :hasta"
        params["hasta"] = hasta
    sql += " ORDER BY v.fecha DESC, v.id_venta DESC"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        return _agregar_items(cur, a_diccionarios(cur))


def obtener(id_venta):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(SELECT_VENTAS + " WHERE v.id_venta = :id", {"id": id_venta})
        ventas = _agregar_items(cur, a_diccionarios(cur))
        return ventas[0] if ventas else None


def crear(datos, id_usuario):
    if not datos.items and not datos.trabajo:
        raise HTTPException(status_code=400, detail="La venta debe tener al menos un repuesto o mano de obra")
    if datos.trabajo and not datos.id_moto:
        raise HTTPException(status_code=400, detail="Para registrar mano de obra debe elegir la moto")

    # Todo pasa en UNA transacción: si algo falla, no se guarda nada
    with obtener_conexion() as con, con.cursor() as cur:
        id_cliente = datos.id_cliente
        if datos.id_moto:
            cur.execute("SELECT id_cliente FROM motos_cliente WHERE id_moto = :id", {"id": datos.id_moto})
            fila = cur.fetchone()
            if fila is None:
                raise HTTPException(status_code=404, detail="Moto no encontrada")
            id_cliente = fila[0]   # el dueño de la moto

        # 1. La mano de obra (se crea el trabajo y se le asigna al mecánico)
        id_trabajo = None
        if datos.trabajo:
            cur.execute("""SELECT 1 FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol
                           WHERE u.id_usuario = :id AND r.nombre = 'TRABAJADOR' AND u.activo = 'S'""",
                        {"id": datos.trabajo.id_usuario})
            if cur.fetchone() is None:
                raise HTTPException(status_code=400, detail="El mecánico elegido no es un trabajador activo")
            nuevo = cur.var(int)
            cur.execute(
                """INSERT INTO trabajos (id_moto, id_usuario, id_tipo, descripcion, costo, estado, fecha_terminado)
                   VALUES (:id_moto, :id_usuario, :id_tipo, :descripcion, :costo, :estado,
                           CASE WHEN :estado = 'TERMINADO' THEN SYSDATE END)
                   RETURNING id_trabajo INTO :nuevo""",
                {"id_moto": datos.id_moto, **datos.trabajo.model_dump(), "nuevo": nuevo})
            id_trabajo = nuevo.getvalue()[0]

        # 2. La venta (la "factura")
        nuevo = cur.var(int)
        cur.execute(
            """INSERT INTO ventas (id_cliente, id_moto, id_trabajo, id_usuario)
               VALUES (:id_cliente, :id_moto, :id_trabajo, :id_usuario)
               RETURNING id_venta INTO :nuevo""",
            {"id_cliente": id_cliente, "id_moto": datos.id_moto, "id_trabajo": id_trabajo,
             "id_usuario": id_usuario, "nuevo": nuevo})
        id_venta = nuevo.getvalue()[0]

        # 3. Los repuestos: cada uno baja el stock
        for item in datos.items:
            cur.execute("SELECT nombre, stock, precio FROM repuestos WHERE id_repuesto = :id FOR UPDATE",
                        {"id": item.id_repuesto})
            fila = cur.fetchone()
            if fila is None:
                raise HTTPException(status_code=404, detail="Uno de los repuestos no existe")
            nombre, stock, precio = fila
            if item.cantidad > stock:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente de {nombre}: solo hay {stock}")
            cur.execute(
                """INSERT INTO movimientos (tipo, id_repuesto, cantidad, precio_unitario, id_usuario,
                                            id_cliente, id_trabajo, id_venta)
                   VALUES ('VENTA', :id_repuesto, :cantidad, :precio, :id_usuario, :id_cliente, :id_trabajo, :id_venta)""",
                {"id_repuesto": item.id_repuesto, "cantidad": item.cantidad,
                 "precio": item.precio_unitario or precio, "id_usuario": id_usuario,
                 "id_cliente": id_cliente, "id_trabajo": id_trabajo, "id_venta": id_venta})
            cur.execute("UPDATE repuestos SET stock = stock - :cantidad WHERE id_repuesto = :id",
                        {"cantidad": item.cantidad, "id": item.id_repuesto})

        con.commit()   # 4. Se guarda TODO junto
    return obtener(id_venta)


def anular(id_venta):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("SELECT id_trabajo FROM ventas WHERE id_venta = :id", {"id": id_venta})
        fila = cur.fetchone()
        if fila is None:
            return False
        id_trabajo = fila[0]
        cur.execute("SELECT id_repuesto, cantidad FROM movimientos WHERE id_venta = :id", {"id": id_venta})
        for id_repuesto, cantidad in cur.fetchall():   # los repuestos vuelven al inventario
            cur.execute("UPDATE repuestos SET stock = stock + :cantidad WHERE id_repuesto = :id",
                        {"cantidad": cantidad, "id": id_repuesto})
        cur.execute("DELETE FROM movimientos WHERE id_venta = :id", {"id": id_venta})
        cur.execute("DELETE FROM ventas WHERE id_venta = :id", {"id": id_venta})
        if id_trabajo:
            cur.execute("DELETE FROM trabajos WHERE id_trabajo = :id", {"id": id_trabajo})
        con.commit()
        return True


    