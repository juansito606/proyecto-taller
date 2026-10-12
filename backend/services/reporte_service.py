# services/reporte_service.py - Consultas del dashboard y de los reportes
from database.conexion import obtener_conexion, a_diccionarios


def _consulta(sql, params=None):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params or {})
        return a_diccionarios(cur)


def dashboard():
    inventario = _consulta("""
        SELECT COUNT(*) AS total_repuestos, NVL(SUM(stock), 0) AS unidades_en_stock,
               NVL(SUM(precio * stock), 0) AS valor_inventario,
               SUM(CASE WHEN stock <= stock_minimo THEN 1 ELSE 0 END) AS repuestos_stock_bajo
        FROM repuestos""")[0]

    ventas = _consulta("""
        SELECT NVL(SUM(CASE WHEN TRUNC(fecha) = TRUNC(SYSDATE)
                            THEN cantidad * precio_unitario END), 0) AS ventas_hoy,
               NVL(SUM(CASE WHEN TRUNC(fecha, 'MM') = TRUNC(SYSDATE, 'MM')
                            THEN cantidad * precio_unitario END), 0) AS ventas_mes
        FROM movimientos WHERE tipo = 'VENTA'""")[0]

    trabajos = {f["estado"]: f["cantidad"] for f in _consulta(
        "SELECT estado, COUNT(*) AS cantidad FROM trabajos GROUP BY estado")}

    clientes = _consulta("SELECT COUNT(*) AS total_clientes FROM clientes")[0]

    stock_bajo = _consulta("""
        SELECT r.id_repuesto, r.nombre, c.nombre AS categoria, r.stock, r.stock_minimo
        FROM repuestos r JOIN categorias c ON c.id_categoria = r.id_categoria
        WHERE r.stock <= r.stock_minimo ORDER BY r.stock""")

    ultimos = _consulta("""
        SELECT * FROM (
            SELECT mv.fecha, mv.tipo, r.nombre AS repuesto, mv.cantidad,
                   mv.cantidad * mv.precio_unitario AS total, u.nombre AS usuario
            FROM movimientos mv
            JOIN repuestos r ON r.id_repuesto = mv.id_repuesto
            JOIN usuarios u  ON u.id_usuario  = mv.id_usuario
            ORDER BY mv.fecha DESC, mv.id_movimiento DESC)
        WHERE ROWNUM <= 5""")

    return {
        **inventario, **ventas, **clientes,
        "trabajos_pendientes": trabajos.get("PENDIENTE", 0),
        "trabajos_en_proceso": trabajos.get("EN PROCESO", 0),
        "trabajos_terminados": trabajos.get("TERMINADO", 0),
        "lista_stock_bajo": stock_bajo,
        "ultimos_movimientos": ultimos,
    }


def ventas_por_mes():
    return _consulta("""
        SELECT TO_CHAR(fecha, 'YYYY-MM') AS mes, COUNT(*) AS cantidad_ventas,
               SUM(cantidad * precio_unitario) AS total_vendido
        FROM movimientos WHERE tipo = 'VENTA'
        GROUP BY TO_CHAR(fecha, 'YYYY-MM') ORDER BY mes""")


def repuestos_mas_vendidos(limite=10):
    return _consulta("""
        SELECT * FROM (
            SELECT r.nombre AS repuesto, SUM(m.cantidad) AS unidades_vendidas,
                   SUM(m.cantidad * m.precio_unitario) AS total_vendido
            FROM movimientos m JOIN repuestos r ON r.id_repuesto = m.id_repuesto
            WHERE m.tipo = 'VENTA'
            GROUP BY r.nombre ORDER BY unidades_vendidas DESC)
        WHERE ROWNUM <= :limite""", {"limite": limite})


def trabajos_por_trabajador():
    return _consulta("""
        SELECT u.nombre AS trabajador, COUNT(t.id_trabajo) AS trabajos,
               SUM(CASE WHEN t.estado = 'TERMINADO' THEN 1 ELSE 0 END) AS terminados,
               NVL(SUM(t.costo), 0) AS total_cobrado
        FROM trabajos t JOIN usuarios u ON u.id_usuario = t.id_usuario
        GROUP BY u.nombre ORDER BY trabajos DESC""")


def flujo_caja(desde=None, hasta=None):
    filtro, params = "", {}
    if desde:
        filtro += " AND TRUNC(fecha) >= :desde"
        params["desde"] = desde
    if hasta:
        filtro += " AND TRUNC(fecha) <= :hasta"
        params["hasta"] = hasta
    fila = _consulta(f"""
        SELECT
          (SELECT NVL(SUM(cantidad * precio_unitario), 0) FROM movimientos
            WHERE tipo = 'VENTA' {filtro})  AS ingresos_ventas,
          (SELECT NVL(SUM(costo), 0) FROM trabajos WHERE 1 = 1 {filtro}) AS ingresos_trabajos,
          (SELECT NVL(SUM(cantidad * precio_unitario), 0) FROM movimientos
            WHERE tipo = 'COMPRA' {filtro}) AS egresos_compras
        FROM dual""", params)[0]
    fila["balance"] = fila["ingresos_ventas"] + fila["ingresos_trabajos"] - fila["egresos_compras"]
    return fila
