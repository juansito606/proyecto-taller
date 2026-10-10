-- =====================================================
-- 03_data.sql - Datos iniciales para pruebas
-- =====================================================
SET DEFINE OFF;

-- ROLES (solo se permiten estos 3)
INSERT INTO roles (nombre, descripcion) VALUES ('ADMINISTRADOR', 'Control total del sistema');
INSERT INTO roles (nombre, descripcion) VALUES ('VENDEDOR', 'Registra ventas, compras y clientes');
INSERT INTO roles (nombre, descripcion) VALUES ('TRABAJADOR', 'Registra los trabajos del taller');

-- USUARIOS (contrasenas cifradas: admin123, vend123, trab123)
INSERT INTO usuarios (nombre, usuario, contrasena, id_rol) VALUES ('Juan Izquierdo', 'admin',  '$2b$10$tG4pORSQujqFwYWzI6Ql1ueZvUpALErCSQ7GAMLKf.YO6u4R1F.1G', 1);
INSERT INTO usuarios (nombre, usuario, contrasena, id_rol) VALUES ('Pedro Gomez',    'pedro',  '$2b$10$F1QTCDBDhbQkE2cWY7L2juLEl5yeInveDUP4.E5pVQAnznKLQYLtO', 2);
INSERT INTO usuarios (nombre, usuario, contrasena, id_rol) VALUES ('Luis Ruiz',      'luis',   '$2b$10$SxljZtkRj6QLT0Abcx5rAeCbBj5RBSjl7WPXdDKYVNSUQCAPb8z7u', 3);
INSERT INTO usuarios (nombre, usuario, contrasena, id_rol) VALUES ('Ana Martinez',   'ana',    '$2b$10$F1QTCDBDhbQkE2cWY7L2juLEl5yeInveDUP4.E5pVQAnznKLQYLtO', 2);
INSERT INTO usuarios (nombre, usuario, contrasena, id_rol) VALUES ('Carlos Rojas',   'carlos', '$2b$10$SxljZtkRj6QLT0Abcx5rAeCbBj5RBSjl7WPXdDKYVNSUQCAPb8z7u', 3);

-- CATEGORIAS
INSERT INTO categorias (nombre, descripcion) VALUES ('Frenos',    'Pastillas, bandas y discos');
INSERT INTO categorias (nombre, descripcion) VALUES ('Motor',     'Filtros, empaques y piezas de motor');
INSERT INTO categorias (nombre, descripcion) VALUES ('Aceites',   'Aceites y lubricantes');
INSERT INTO categorias (nombre, descripcion) VALUES ('Llantas',   'Llantas y neumaticos');
INSERT INTO categorias (nombre, descripcion) VALUES ('Electrico', 'Bujias, baterias y luces');

-- MARCAS
INSERT INTO marcas (nombre) VALUES ('Yamaha');
INSERT INTO marcas (nombre) VALUES ('Honda');
INSERT INTO marcas (nombre) VALUES ('Mobil');
INSERT INTO marcas (nombre) VALUES ('Michelin');
INSERT INTO marcas (nombre) VALUES ('NGK');

-- CLIENTES
INSERT INTO clientes (documento, nombre, telefono, correo) VALUES ('1020304050', 'Carlos Perez',  '3001234567', 'carlos@mail.com');
INSERT INTO clientes (documento, nombre, telefono, correo) VALUES ('1098765432', 'Ana Torres',    '3109876543', NULL);
INSERT INTO clientes (documento, nombre, telefono, correo) VALUES ('1122334455', 'Jorge Diaz',    '3204567890', 'jorge@mail.com');
INSERT INTO clientes (documento, nombre, telefono, correo) VALUES ('1001002003', 'Laura Gomez',   '3015556677', 'laura@mail.com');
INSERT INTO clientes (documento, nombre, telefono, correo) VALUES ('1055667788', 'Miguel Castro', '3157778899', NULL);

-- MOTOS_CLIENTE (el cliente 1 tiene dos motos)
INSERT INTO motos_cliente (placa, marca, modelo, anio, id_cliente) VALUES ('ABC12D', 'Yamaha', 'FZ 2.0',   2022, 1);
INSERT INTO motos_cliente (placa, marca, modelo, anio, id_cliente) VALUES ('XYZ34E', 'Honda',  'CB 190R',  2024, 1);
INSERT INTO motos_cliente (placa, marca, modelo, anio, id_cliente) VALUES ('JKL56F', 'AKT',    'NKD 125',  2021, 2);
INSERT INTO motos_cliente (placa, marca, modelo, anio, id_cliente) VALUES ('MNO78G', 'Suzuki', 'Gixxer',   2023, 3);
INSERT INTO motos_cliente (placa, marca, modelo, anio, id_cliente) VALUES ('PQR90H', 'Bajaj',  'Pulsar NS',2020, 4);
INSERT INTO motos_cliente (placa, marca, modelo, anio, id_cliente) VALUES ('STU11J', 'Yamaha', 'XTZ 150',  2025, 5);

-- REPUESTOS (el 3 y el 6 quedan con stock bajo para el dashboard)
INSERT INTO repuestos (referencia, nombre, id_categoria, id_marca, precio, stock, stock_minimo) VALUES ('FR-001', 'Pastillas de freno delanteras', 1, 1,  85000, 12,  5);
INSERT INTO repuestos (referencia, nombre, id_categoria, id_marca, precio, stock, stock_minimo) VALUES ('MO-001', 'Filtro de aceite',              2, 2,  32000, 30,  5);
INSERT INTO repuestos (referencia, nombre, id_categoria, id_marca, precio, stock, stock_minimo) VALUES ('AC-001', 'Aceite 20W50 1L',               3, 3,  38000,  3, 10);
INSERT INTO repuestos (referencia, nombre, id_categoria, id_marca, precio, stock, stock_minimo) VALUES ('LL-001', 'Llanta trasera 110/90-17',      4, 4, 210000,  6,  2);
INSERT INTO repuestos (referencia, nombre, id_categoria, id_marca, precio, stock, stock_minimo) VALUES ('EL-001', 'Bujia CR7HSA',                  5, 5,  18000, 25,  8);
INSERT INTO repuestos (referencia, nombre, id_categoria, id_marca, precio, stock, stock_minimo) VALUES ('FR-002', 'Banda de freno trasera',        1, 2,  45000,  2,  4);

-- TRABAJOS (los hacen Luis = usuario 3 y Carlos = usuario 5)
INSERT INTO trabajos (id_moto, id_usuario, descripcion, fecha, costo, estado) VALUES (1, 3, 'Cambio de pastillas de freno delanteras', SYSDATE - 5, 40000, 'TERMINADO');
INSERT INTO trabajos (id_moto, id_usuario, descripcion, fecha, costo, estado) VALUES (2, 5, 'Cambio de aceite y filtro',               SYSDATE - 3, 25000, 'TERMINADO');
INSERT INTO trabajos (id_moto, id_usuario, descripcion, fecha, costo, estado) VALUES (3, 3, 'Revision general de motor',               SYSDATE - 1, 60000, 'EN PROCESO');
INSERT INTO trabajos (id_moto, id_usuario, descripcion, fecha, costo, estado) VALUES (4, 5, 'Cambio de llanta trasera',                SYSDATE,     20000, 'PENDIENTE');
INSERT INTO trabajos (id_moto, id_usuario, descripcion, fecha, costo, estado) VALUES (5, 3, 'Cambio de bujia',                         SYSDATE,     15000, 'PENDIENTE');

-- MOVIMIENTOS (compras y ventas; registradas por los vendedores 2 y 4)
INSERT INTO movimientos (tipo, id_repuesto, cantidad, precio_unitario, fecha, id_usuario, id_cliente, id_trabajo) VALUES ('COMPRA', 2, 20, 25000, SYSDATE - 10, 2, NULL, NULL);
INSERT INTO movimientos (tipo, id_repuesto, cantidad, precio_unitario, fecha, id_usuario, id_cliente, id_trabajo) VALUES ('COMPRA', 1, 10, 65000, SYSDATE - 10, 2, NULL, NULL);
INSERT INTO movimientos (tipo, id_repuesto, cantidad, precio_unitario, fecha, id_usuario, id_cliente, id_trabajo) VALUES ('VENTA',  1,  1, 85000, SYSDATE - 5,  2, 1,    1);
INSERT INTO movimientos (tipo, id_repuesto, cantidad, precio_unitario, fecha, id_usuario, id_cliente, id_trabajo) VALUES ('VENTA',  2,  1, 32000, SYSDATE - 3,  4, 1,    2);
INSERT INTO movimientos (tipo, id_repuesto, cantidad, precio_unitario, fecha, id_usuario, id_cliente, id_trabajo) VALUES ('VENTA',  3,  1, 38000, SYSDATE - 3,  4, 1,    2);
INSERT INTO movimientos (tipo, id_repuesto, cantidad, precio_unitario, fecha, id_usuario, id_cliente, id_trabajo) VALUES ('VENTA',  5,  2, 18000, SYSDATE,      2, 3,    NULL);

COMMIT;