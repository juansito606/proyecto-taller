# services/movimiento_service.py - Ventas y compras: mueven el stock en una transacción
from fastapi import HTTPException

from database.conexion import obtener_conexion, a_diccionarios

SELECT_MOVIMIENTOS = """
    SELECT mv.id_movimiento, mv.tipo, mv.id_repuesto, r.nombre AS repuesto,
           mv.cantidad, mv.precio_unitario, mv.cantidad * mv.precio_unitario AS total,
           mv.fecha, mv.id_usuario, u.nombre AS usuario,
           mv.id_cliente, c.nombre AS cliente, mv.id_trabajo
    FROM movimientos mv
    JOIN repuestos r     ON r.id_repuesto = mv.id_repuesto
    JOIN usuarios u      ON u.id_usuario  = mv.id_usuario
    LEFT JOIN clientes c ON c.id_cliente  = mv.id_cliente
"""


def listar(tipo=None, id_repuesto=None, desde=None, hasta=None):
    sql = SELECT_MOVIMIENTOS + " WHERE 1 = 1"
    params = {}
    if tipo:
        sql += " AND mv.tipo = :tipo"
        params["tipo"] = tipo
    if id_repuesto:
        sql += " AND mv.id_repuesto = :id_repuesto"
        params["id_repuesto"] = id_repuesto
    if desde:
        sql += " AND TRUNC(mv.fecha) >= :desde"
        params["desde"] = desde
    if hasta:
        sql += " AND TRUNC(mv.fecha) <= :hasta"
        params["hasta"] = hasta
    sql += " ORDER BY mv.fecha DESC, mv.id_movimiento DESC"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        return a_diccionarios(cur)


def obtener(id_movimiento):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(SELECT_MOVIMIENTOS + " WHERE mv.id_movimiento = :id", {"id": id_movimiento})
        filas = a_diccionarios(cur)
        return filas[0] if filas else None


def crear(datos, id_usuario):
    with obtener_conexion() as con, con.cursor() as cur:
        # 1. Leer el repuesto y BLOQUEARLO (FOR UPDATE) para que nadie lo cambie a la vez
        cur.execute("SELECT stock, precio FROM repuestos WHERE id_repuesto = :id FOR UPDATE",
                    {"id": datos.id_repuesto})
        fila = cur.fetchone()
        if fila is None:
            raise HTTPException(status_code=404, detail="Repuesto no encontrado")
        stock, precio = fila

        # 2. Reglas del negocio
        if datos.tipo == "VENTA":
            if datos.cantidad > stock:
                raise HTTPException(status_code=400,
                                    detail=f"Stock insuficiente: solo hay {stock} unidades")
            nuevo_stock = stock - datos.cantidad
            precio_unitario = datos.precio_unitario or precio
        else:
            if datos.precio_unitario is None:
                raise HTTPException(status_code=400, detail="En una compra debe indicar el precio unitario")
            nuevo_stock = stock + datos.cantidad
            precio_unitario = datos.precio_unitario

        # 3. Guardar el movimiento
        nuevo_id = cur.var(int)
        cur.execute(
            """INSERT INTO movimientos (tipo, id_repuesto, cantidad, precio_unitario,
                                        id_usuario, id_cliente, id_trabajo)
               VALUES (:tipo, :id_repuesto, :cantidad, :precio, :id_usuario, :id_cliente, :id_trabajo)
               RETURNING id_movimiento INTO :nuevo_id""",
            {"tipo": datos.tipo, "id_repuesto": datos.id_repuesto, "cantidad": datos.cantidad,
             "precio": precio_unitario, "id_usuario": id_usuario, "id_cliente": datos.id_cliente,
             "id_trabajo": datos.id_trabajo, "nuevo_id": nuevo_id},
        )

        # 4. Actualizar el stock
        cur.execute("UPDATE repuestos SET stock = :stock WHERE id_repuesto = :id",
                    {"stock": nuevo_stock, "id": datos.id_repuesto})

        # 5. Confirmar los dos pasos juntos (transacción)
        con.commit()
        return obtener(nuevo_id.getvalue()[0])


def anular(id_movimiento):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("SELECT tipo, id_repuesto, cantidad FROM movimientos WHERE id_movimiento = :id",
                    {"id": id_movimiento})
        fila = cur.fetchone()
        if fila is None:
            return False
        tipo, id_repuesto, cantidad = fila

        cur.execute("SELECT stock FROM repuestos WHERE id_repuesto = :id FOR UPDATE", {"id": id_repuesto})
        stock = cur.fetchone()[0]

        # Se deshace el efecto: anular una venta devuelve unidades; anular una compra las quita
        nuevo_stock = stock + cantidad if tipo == "VENTA" else stock - cantidad
        if nuevo_stock < 0:
            raise HTTPException(status_code=400,
                                detail="No se puede anular la compra: esas unidades ya se vendieron")

        cur.execute("DELETE FROM movimientos WHERE id_movimiento = :id", {"id": id_movimiento})
        cur.execute("UPDATE repuestos SET stock = :stock WHERE id_repuesto = :id",
                    {"stock": nuevo_stock, "id": id_repuesto})
        con.commit()
        return True


    