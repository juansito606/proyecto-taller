-- =====================================================
-- 02_constraints.sql - Llaves y restricciones de integridad
-- =====================================================

-- 1. ROLES
ALTER TABLE roles ADD CONSTRAINT pk_roles PRIMARY KEY (id_rol);
ALTER TABLE roles ADD CONSTRAINT uq_roles_nombre UNIQUE (nombre);
ALTER TABLE roles ADD CONSTRAINT ck_roles_nombre
    CHECK (nombre IN ('ADMINISTRADOR', 'VENDEDOR', 'TRABAJADOR'));

-- 2. USUARIOS
ALTER TABLE usuarios ADD CONSTRAINT pk_usuarios PRIMARY KEY (id_usuario);
ALTER TABLE usuarios ADD CONSTRAINT uq_usuarios_usuario UNIQUE (usuario);
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_rol
    FOREIGN KEY (id_rol) REFERENCES roles (id_rol);
ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_activo CHECK (activo IN ('S', 'N'));

-- 3. CATEGORIAS
ALTER TABLE categorias ADD CONSTRAINT pk_categorias PRIMARY KEY (id_categoria);
ALTER TABLE categorias ADD CONSTRAINT uq_categorias_nombre UNIQUE (nombre);

-- 4. MARCAS
ALTER TABLE marcas ADD CONSTRAINT pk_marcas PRIMARY KEY (id_marca);
ALTER TABLE marcas ADD CONSTRAINT uq_marcas_nombre UNIQUE (nombre);

-- 5. CLIENTES
ALTER TABLE clientes ADD CONSTRAINT pk_clientes PRIMARY KEY (id_cliente);
ALTER TABLE clientes ADD CONSTRAINT uq_clientes_documento UNIQUE (documento);

-- 6. MOTOS_CLIENTE
ALTER TABLE motos_cliente ADD CONSTRAINT pk_motos_cliente PRIMARY KEY (id_moto);
ALTER TABLE motos_cliente ADD CONSTRAINT uq_motos_placa UNIQUE (placa);
ALTER TABLE motos_cliente ADD CONSTRAINT fk_motos_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente);
ALTER TABLE motos_cliente ADD CONSTRAINT ck_motos_anio CHECK (anio BETWEEN 1950 AND 2100);

-- 7. REPUESTOS
ALTER TABLE repuestos ADD CONSTRAINT pk_repuestos PRIMARY KEY (id_repuesto);
ALTER TABLE repuestos ADD CONSTRAINT uq_repuestos_referencia UNIQUE (referencia);
ALTER TABLE repuestos ADD CONSTRAINT fk_repuestos_categoria
    FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria);
ALTER TABLE repuestos ADD CONSTRAINT fk_repuestos_marca
    FOREIGN KEY (id_marca) REFERENCES marcas (id_marca);
ALTER TABLE repuestos ADD CONSTRAINT ck_repuestos_precio CHECK (precio > 0);
ALTER TABLE repuestos ADD CONSTRAINT ck_repuestos_stock CHECK (stock >= 0);
ALTER TABLE repuestos ADD CONSTRAINT ck_repuestos_minimo CHECK (stock_minimo >= 0);

-- 8. TRABAJOS
ALTER TABLE trabajos ADD CONSTRAINT pk_trabajos PRIMARY KEY (id_trabajo);
ALTER TABLE trabajos ADD CONSTRAINT fk_trabajos_moto
    FOREIGN KEY (id_moto) REFERENCES motos_cliente (id_moto);
ALTER TABLE trabajos ADD CONSTRAINT fk_trabajos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario);
ALTER TABLE trabajos ADD CONSTRAINT ck_trabajos_costo CHECK (costo >= 0);
ALTER TABLE trabajos ADD CONSTRAINT ck_trabajos_estado
    CHECK (estado IN ('PENDIENTE', 'EN PROCESO', 'TERMINADO'));

-- 9. MOVIMIENTOS
ALTER TABLE movimientos ADD CONSTRAINT pk_movimientos PRIMARY KEY (id_movimiento);
ALTER TABLE movimientos ADD CONSTRAINT fk_mov_repuesto
    FOREIGN KEY (id_repuesto) REFERENCES repuestos (id_repuesto);
ALTER TABLE movimientos ADD CONSTRAINT fk_mov_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario);
ALTER TABLE movimientos ADD CONSTRAINT fk_mov_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente);
ALTER TABLE movimientos ADD CONSTRAINT fk_mov_trabajo
    FOREIGN KEY (id_trabajo) REFERENCES trabajos (id_trabajo);
ALTER TABLE movimientos ADD CONSTRAINT ck_mov_tipo CHECK (tipo IN ('VENTA', 'COMPRA'));
ALTER TABLE movimientos ADD CONSTRAINT ck_mov_cantidad CHECK (cantidad > 0);
ALTER TABLE movimientos ADD CONSTRAINT ck_mov_precio CHECK (precio_unitario > 0);

-- 10. VENTAS
ALTER TABLE ventas ADD CONSTRAINT pk_ventas PRIMARY KEY (id_venta);
ALTER TABLE ventas ADD CONSTRAINT uq_ventas_trabajo UNIQUE (id_trabajo);
ALTER TABLE ventas ADD CONSTRAINT fk_ventas_cliente FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente);
ALTER TABLE ventas ADD CONSTRAINT fk_ventas_moto FOREIGN KEY (id_moto) REFERENCES motos_cliente (id_moto);
ALTER TABLE ventas ADD CONSTRAINT fk_ventas_trabajo FOREIGN KEY (id_trabajo) REFERENCES trabajos (id_trabajo);
ALTER TABLE ventas ADD CONSTRAINT fk_ventas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario);
ALTER TABLE movimientos ADD CONSTRAINT fk_mov_venta FOREIGN KEY (id_venta) REFERENCES ventas (id_venta);