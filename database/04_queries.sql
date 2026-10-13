-- =====================================================
-- 04_queries.sql - Consultas principales del sistema
-- (son las mismas que usa la API en services/reporte_service.py y otros)
-- =====================================================

-- ===================== DASHBOARD =====================

-- 1. Resumen del inventario
SELECT COUNT(*)                                            AS total_repuestos,
       NVL(SUM(stock), 0)                                  AS unidades_en_stock,
       NVL(SUM(precio * stock), 0)                         AS valor_inventario,
       SUM(CASE WHEN stock <= stock_minimo THEN 1 ELSE 0 END) AS repuestos_stock_bajo
FROM repuestos;

-- 2. Repuestos con stock bajo (alerta del dashboard)
SELECT r.referencia, r.nombre, c.nombre AS categoria, r.stock, r.stock_minimo
FROM repuestos r
JOIN categorias c ON c.id_categoria = r.id_categoria
WHERE r.stock <= r.stock_minimo
ORDER BY r.stock;

-- 3. Ingresos de hoy y del mes: repuestos vendidos + mano de obra terminada
SELECT (SELECT NVL(SUM(cantidad * precio_unitario), 0) FROM movimientos
         WHERE tipo = 'VENTA' AND TRUNC(fecha) = TRUNC(SYSDATE))            AS repuestos_hoy,
       (SELECT NVL(SUM(costo), 0) FROM trabajos
         WHERE TRUNC(fecha_terminado) = TRUNC(SYSDATE))                     AS mano_obra_hoy,
       (SELECT NVL(SUM(cantidad * precio_unitario), 0) FROM movimientos
         WHERE tipo = 'VENTA' AND TRUNC(fecha, 'MM') = TRUNC(SYSDATE, 'MM')) AS repuestos_mes,
       (SELECT NVL(SUM(costo), 0) FROM trabajos
         WHERE TRUNC(fecha_terminado, 'MM') = TRUNC(SYSDATE, 'MM'))         AS mano_obra_mes
FROM dual;

-- 4. Trabajos por estado
SELECT estado, COUNT(*) AS cantidad
FROM trabajos
GROUP BY estado;

-- ===================== REPORTES =====================

-- 5. Ventas de repuestos por mes
SELECT TO_CHAR(fecha, 'YYYY-MM') AS mes,
       COUNT(*)                     AS cantidad_movimientos,
       SUM(cantidad * precio_unitario) AS total_vendido
FROM movimientos
WHERE tipo = 'VENTA'
GROUP BY TO_CHAR(fecha, 'YYYY-MM')
ORDER BY mes;

-- 6. Top 10 de repuestos mas vendidos
SELECT * FROM (
    SELECT r.nombre AS repuesto,
           SUM(m.cantidad)                   AS unidades_vendidas,
           SUM(m.cantidad * m.precio_unitario) AS total_vendido
    FROM movimientos m
    JOIN repuestos r ON r.id_repuesto = m.id_repuesto
    WHERE m.tipo = 'VENTA'
    GROUP BY r.nombre
    ORDER BY unidades_vendidas DESC
)
WHERE ROWNUM <= 10;

-- 7. Trabajos por mecanico (cuanto ha cobrado y cuanto tiene por cobrar)
SELECT u.nombre AS trabajador,
       COUNT(t.id_trabajo)                                          AS trabajos,
       SUM(CASE WHEN t.estado = 'TERMINADO' THEN 1 ELSE 0 END)       AS terminados,
       NVL(SUM(CASE WHEN t.estado = 'TERMINADO' THEN t.costo END), 0)  AS total_cobrado,
       NVL(SUM(CASE WHEN t.estado <> 'TERMINADO' THEN t.costo END), 0) AS por_cobrar
FROM trabajos t
JOIN usuarios u ON u.id_usuario = t.id_usuario
GROUP BY u.nombre
ORDER BY total_cobrado DESC;

-- 8. Flujo de caja: ingresos (ventas + mano de obra) menos egresos (compras)
SELECT (SELECT NVL(SUM(cantidad * precio_unitario), 0) FROM movimientos WHERE tipo = 'VENTA')  AS ingresos_repuestos,
       (SELECT NVL(SUM(costo), 0) FROM trabajos WHERE estado = 'TERMINADO')                    AS ingresos_mano_obra,
       (SELECT NVL(SUM(cantidad * precio_unitario), 0) FROM movimientos WHERE tipo = 'COMPRA') AS egresos_compras
FROM dual;

-- 9. Trabajos por tipo (que servicios se hacen mas)
SELECT NVL(tt.nombre, 'Sin tipo') AS tipo_trabajo,
       COUNT(t.id_trabajo)       AS cantidad,
       NVL(SUM(t.costo), 0)      AS mano_obra_total
FROM trabajos t
LEFT JOIN tipos_trabajo tt ON tt.id_tipo = t.id_tipo
GROUP BY NVL(tt.nombre, 'Sin tipo')
ORDER BY cantidad DESC;

-- ============ CONSULTAS DEL FUNCIONAMIENTO ============

-- 10. Ventas con su total (repuestos + mano de obra), las mas recientes primero
SELECT v.id_venta, v.fecha, NVL(c.nombre, 'Mostrador') AS cliente, mc.placa,
       NVL((SELECT SUM(m.cantidad * m.precio_unitario) FROM movimientos m
             WHERE m.id_venta = v.id_venta), 0) AS total_repuestos,
       NVL(t.costo, 0) AS mano_obra
FROM ventas v
LEFT JOIN clientes c       ON c.id_cliente = v.id_cliente
LEFT JOIN motos_cliente mc ON mc.id_moto   = v.id_moto
LEFT JOIN trabajos t       ON t.id_trabajo = v.id_trabajo
ORDER BY v.fecha DESC;

-- 11. Historial de una moto: trabajos que se le han hecho y repuestos que se le vendieron
SELECT mc.placa, t.fecha, tt.nombre AS tipo, t.descripcion, t.estado, t.costo, u.nombre AS mecanico
FROM trabajos t
JOIN motos_cliente mc     ON mc.id_moto   = t.id_moto
JOIN usuarios u           ON u.id_usuario = t.id_usuario
LEFT JOIN tipos_trabajo tt ON tt.id_tipo  = t.id_tipo
WHERE mc.placa = 'JCI56I'
ORDER BY t.fecha DESC;

-- 12. Trabajos pendientes de un mecanico (lo que ve el TRABAJADOR)
SELECT t.id_trabajo, mc.placa, mc.apodo, t.descripcion, t.estado, t.costo
FROM trabajos t
JOIN motos_cliente mc ON mc.id_moto = t.id_moto
JOIN usuarios u       ON u.id_usuario = t.id_usuario
WHERE u.usuario = 'andres' AND t.estado <> 'TERMINADO'
ORDER BY t.fecha;

-- 13. Clientes con la cantidad de motos que tienen
SELECT c.nombre, c.telefono, COUNT(mc.id_moto) AS motos
FROM clientes c
LEFT JOIN motos_cliente mc ON mc.id_cliente = c.id_cliente
GROUP BY c.nombre, c.telefono
ORDER BY motos DESC;

-- 14. Ultimas 10 acciones de la bitacora (campanita del administrador)
SELECT * FROM (
    SELECT a.fecha, u.nombre AS quien, a.tipo, a.accion, a.detalle, a.monto
    FROM actividad a
    JOIN usuarios u ON u.id_usuario = a.id_usuario
    ORDER BY a.fecha DESC, a.id_actividad DESC
)
WHERE ROWNUM <= 10;

