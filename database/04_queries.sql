
-- =====================================================
-- 04_queries.sql - Consultas del sistema
-- =====================================================

-- ===== DASHBOARD =====

-- 1. Resumen del inventario
SELECT COUNT(*)                  AS total_repuestos,
       SUM(stock)                AS unidades_en_stock,
       SUM(precio * stock)       AS valor_inventario
FROM repuestos;

-- 2. Repuestos con stock bajo (alerta del dashboard)
SELECT r.referencia, r.nombre, c.nombre AS categoria, r.stock, r.stock_minimo
FROM repuestos r
JOIN categorias c ON c.id_categoria = r.id_categoria
WHERE r.stock <= r.stock_minimo
ORDER BY r.stock;

-- 3. Ventas de hoy
SELECT NVL(SUM(cantidad * precio_unitario), 0) AS ventas_hoy
FROM movimientos
WHERE tipo = 'VENTA' AND TRUNC(fecha) = TRUNC(SYSDATE);

-- 4. Trabajos por estado
SELECT estado, COUNT(*) AS cantidad
FROM trabajos
GROUP BY estado;

-- ===== REPORTES =====

-- 5. Ventas por mes
SELECT TO_CHAR(fecha, 'YYYY-MM') AS mes,
       SUM(cantidad * precio_unitario) AS total_vendido
FROM movimientos
WHERE tipo = 'VENTA'
GROUP BY TO_CHAR(fecha, 'YYYY-MM')
ORDER BY mes;

-- 6. Repuestos mas vendidos
SELECT r.nombre, SUM(m.cantidad) AS unidades_vendidas
FROM movimientos m
JOIN repuestos r ON r.id_repuesto = m.id_repuesto
WHERE m.tipo = 'VENTA'
GROUP BY r.nombre
ORDER BY unidades_vendidas DESC;

-- 7. Trabajos y dinero por trabajador
SELECT u.nombre AS trabajador, COUNT(t.id_trabajo) AS trabajos, SUM(t.costo) AS total_cobrado
FROM trabajos t
JOIN usuarios u ON u.id_usuario = t.id_usuario
GROUP BY u.nombre
ORDER BY trabajos DESC;

-- 8. Flujo de caja: ventas + trabajos - compras
SELECT
  (SELECT NVL(SUM(cantidad * precio_unitario), 0) FROM movimientos WHERE tipo = 'VENTA')  AS ingresos_ventas,
  (SELECT NVL(SUM(costo), 0) FROM trabajos)                                               AS ingresos_trabajos,
  (SELECT NVL(SUM(cantidad * precio_unitario), 0) FROM movimientos WHERE tipo = 'COMPRA') AS egresos_compras
FROM dual;

-- 9. Historial de movimientos de un usuario (ejemplo: pedro)
SELECT m.fecha, m.tipo, r.nombre AS repuesto, m.cantidad, m.precio_unitario
FROM movimientos m
JOIN repuestos r ON r.id_repuesto = m.id_repuesto
JOIN usuarios u  ON u.id_usuario  = m.id_usuario
WHERE u.usuario = 'pedro'
ORDER BY m.fecha DESC;

-- ===== BUSQUEDAS Y FILTROS =====

-- 10. Buscar repuestos por nombre y filtrar por categoria
SELECT r.referencia, r.nombre, c.nombre AS categoria, m.nombre AS marca, r.precio, r.stock
FROM repuestos r
JOIN categorias c ON c.id_categoria = r.id_categoria
JOIN marcas m     ON m.id_marca     = r.id_marca
WHERE UPPER(r.nombre) LIKE '%FRENO%'
  AND c.nombre = 'Frenos';

-- 11. Buscar clientes por nombre o documento
SELECT documento, nombre, telefono
FROM clientes
WHERE UPPER(nombre) LIKE '%CARLOS%' OR documento LIKE '%1020%';

-- 12. Historial de una moto por placa
SELECT mc.placa, c.nombre AS cliente, t.fecha, t.descripcion, t.estado, u.nombre AS trabajador
FROM trabajos t
JOIN motos_cliente mc ON mc.id_moto    = t.id_moto
JOIN clientes c       ON c.id_cliente  = mc.id_cliente
JOIN usuarios u       ON u.id_usuario  = t.id_usuario
WHERE mc.placa = 'ABC12D'
ORDER BY t.fecha DESC;

