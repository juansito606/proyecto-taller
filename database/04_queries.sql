-- =====================================================
-- 04_queries.sql - Consultas del sistema
-- =====================================================

-- ===== DASHBOARD =====

-- 1. Resumen del inventario
SELECT COUNT(*)            AS total_repuestos,
       SUM(stock)          AS unidades_en_stock,
       SUM(precio * stock) AS valor_inventario
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


