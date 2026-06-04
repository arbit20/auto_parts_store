-- =====================================================================
-- BAGG AUTOPARTES  -  PARCHE INCREMENTAL  (v1)
-- Aplicar DESPUES de bagg_autopartes.sql sobre la misma base.
-- Motor objetivo: MySQL 8.0.19+ / MariaDB 10.4+   |   Charset: utf8mb4
--
-- Resuelve los hallazgos del review:
--   C1 chk XOR de importacion   C2 quitar CASCADE financiero   C3 reglas 1P/3P
--   C4 stock = una fuente       C5 movimientos solo en ofertas propias
--   I1/I2 dominios y anios       I3 detalle<->envio   I4 costo congelado
--   I5 moneda en pedidos         I6 historial/auditoria   M2 actualizado_en
--
-- ORDEN OBLIGATORIO de ejecucion: A -> B -> C -> D -> F1 -> E -> F2 -> G
--   (la correccion de stock F1 va ANTES de crear los triggers E para no
--    doble-contar la semilla ya cargada).
-- =====================================================================

USE bagg_autopartes;

-- =====================================================================
-- BLOQUE A : INDICES
--   Solo se crean indices que aportan valor MAS ALLA de los que InnoDB
--   ya genera automaticamente sobre cada columna FK. (Login por email ya
--   esta cubierto por usuarios.email UNIQUE; compatibilidades por uq_comp.)
-- =====================================================================

CREATE INDEX ix_ofertas_producto_activo   ON ofertas (producto_id, activo, tipo_venta); -- vitrina: ofertas activas por producto
CREATE INDEX ix_ofertas_vendedor_activo    ON ofertas (vendedor_id, activo);            -- portal proveedor: sus ofertas activas
CREATE INDEX ix_productos_categoria_activo ON productos (categoria_id, activo);          -- catalogo: productos activos por categoria
CREATE INDEX ix_pedidos_usuario_estado     ON pedidos (usuario_id, estado);             -- "mis pedidos" filtrados por estado
CREATE INDEX ix_pedidos_estado_fecha       ON pedidos (estado, fecha);                  -- cola administrativa por estado/fecha
CREATE INDEX ix_pagos_pedido_estado        ON pagos (pedido_id, estado);               -- pagos pendientes por pedido
CREATE INDEX ix_envios_estado              ON envios (estado);                          -- operacion logistica por estado
CREATE INDEX ix_gi_estado_aduana           ON gestiones_importacion (estado_aduana);    -- importaciones pendientes
CREATE INDEX ix_mov_oferta_fecha           ON movimientos_inventario (oferta_id, fecha);-- kardex por oferta en el tiempo

-- =====================================================================
-- BLOQUE B : RESTRICCIONES (CHECK / UNIQUE / FK)
-- =====================================================================

-- C3: coherencia del modelo 1P/3P en ofertas
ALTER TABLE ofertas ADD CONSTRAINT chk_oferta_modelo
  CHECK ((tipo_venta = 'propio'      AND vendedor_id IS NULL     AND precio_compra > 0)
      OR (tipo_venta = 'marketplace' AND vendedor_id IS NOT NULL AND comision_pct  > 0));

-- I1: dominios numericos (evitan negativos / valores invalidos)
ALTER TABLE ofertas        ADD CONSTRAINT chk_oferta_precio   CHECK (precio >= 0 AND precio_compra >= 0 AND stock >= 0 AND stock_minimo >= 0);
ALTER TABLE ofertas        ADD CONSTRAINT chk_oferta_comision CHECK (comision_pct BETWEEN 0 AND 100);
ALTER TABLE detalle_compra ADD CONSTRAINT chk_dc_cant         CHECK (cantidad > 0 AND costo_unitario >= 0);
ALTER TABLE detalle_pedido ADD CONSTRAINT chk_dp_cant         CHECK (cantidad > 0 AND precio_unitario >= 0 AND comision >= 0);
ALTER TABLE carrito_items  ADD CONSTRAINT chk_ci_cant         CHECK (cantidad > 0);
ALTER TABLE pagos          ADD CONSTRAINT chk_pago_monto      CHECK (monto > 0);
ALTER TABLE compras        ADD CONSTRAINT chk_compra_montos   CHECK (subtotal >= 0 AND total >= 0 AND tipo_cambio > 0);

-- I2: rangos de anios coherentes (anio_fin/hasta no puede ser menor al inicio)
ALTER TABLE modelos_vehiculo ADD CONSTRAINT chk_modelo_anios CHECK (anio_inicio IS NULL OR anio_fin   IS NULL OR anio_fin   >= anio_inicio);
ALTER TABLE compatibilidades ADD CONSTRAINT chk_comp_anios   CHECK (anio_desde  IS NULL OR anio_hasta IS NULL OR anio_hasta >= anio_desde);

-- M3 (opcional): evitar ofertas duplicadas exactas de un mismo proveedor.
--   Nota: NULL no colisiona en UNIQUE, por lo que NO bloquea duplicados de ofertas propias (vendedor_id NULL).
ALTER TABLE ofertas ADD CONSTRAINT uq_oferta_vendedor UNIQUE (producto_id, vendedor_id, condicion);

-- C1: reemplazar el CHECK de origen de importacion por un XOR estricto (pedido O compra, no ambos)
--   MySQL 8.0.16-8.0.18:  ALTER TABLE gestiones_importacion DROP CHECK chk_gi_origen;
ALTER TABLE gestiones_importacion DROP CONSTRAINT chk_gi_origen;
ALTER TABLE gestiones_importacion ADD CONSTRAINT chk_gi_origen
  CHECK ((pedido_id IS NOT NULL AND compra_id IS NULL) OR (pedido_id IS NULL AND compra_id IS NOT NULL));

-- C2: quitar ON DELETE CASCADE de registros financieros -> RESTRICT (los pedidos no se hard-deletean)
ALTER TABLE detalle_pedido DROP FOREIGN KEY fk_dp_pedido;
ALTER TABLE detalle_pedido ADD CONSTRAINT fk_dp_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT;
ALTER TABLE pagos  DROP FOREIGN KEY fk_pago_pedido;
ALTER TABLE pagos  ADD CONSTRAINT fk_pago_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT;
ALTER TABLE envios DROP FOREIGN KEY fk_envio_pedido;
ALTER TABLE envios ADD CONSTRAINT fk_envio_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT;

-- I7: conservar el pedido historico aunque se borre la direccion de envio
ALTER TABLE pedidos DROP FOREIGN KEY fk_pedido_dir;
ALTER TABLE pedidos ADD CONSTRAINT fk_pedido_dir FOREIGN KEY (direccion_envio_id) REFERENCES direcciones(id) ON DELETE SET NULL;

-- =====================================================================
-- BLOQUE C : NUEVAS TABLAS  (alcance COMPLETO)
-- =====================================================================

-- Auditoria de cambios de estado de pedido (I6)
CREATE TABLE pedido_estado_historial (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id     INT NOT NULL,
  estado_anterior ENUM('pendiente','pagado','en_preparacion','enviado','entregado','cancelado'),
  estado_nuevo    ENUM('pendiente','pagado','en_preparacion','enviado','entregado','cancelado') NOT NULL,
  usuario_id    INT NULL,                         -- quien ejecuto el cambio (staff)
  comentario    VARCHAR(200),
  fecha         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_peh_pedido  FOREIGN KEY (pedido_id) REFERENCES pedidos(id)  ON DELETE CASCADE,
  CONSTRAINT fk_peh_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Facturacion
CREATE TABLE facturas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id    INT NOT NULL UNIQUE,               -- 1 factura por pedido
  numero       VARCHAR(40) NOT NULL UNIQUE,
  nit_cliente  VARCHAR(30),
  razon_social VARCHAR(150),
  subtotal     DECIMAL(12,2) NOT NULL DEFAULT 0,
  impuesto     DECIMAL(12,2) NOT NULL DEFAULT 0,  -- IVA / IT desglosado
  total        DECIMAL(12,2) NOT NULL DEFAULT 0,
  moneda       ENUM('BOB','USD') DEFAULT 'BOB',
  fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado       ENUM('emitida','anulada') DEFAULT 'emitida',
  CONSTRAINT fk_fact_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT,
  CONSTRAINT chk_fact_montos CHECK (subtotal >= 0 AND impuesto >= 0 AND total >= 0)
);

-- Devoluciones
CREATE TABLE devoluciones (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id  INT NOT NULL,
  motivo     VARCHAR(255),
  estado     ENUM('solicitada','aprobada','rechazada','reembolsada') DEFAULT 'solicitada',
  monto      DECIMAL(12,2) DEFAULT 0,
  fecha      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dev_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT,
  CONSTRAINT chk_dev_monto CHECK (monto >= 0)
);

CREATE TABLE detalle_devolucion (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  devolucion_id     INT NOT NULL,
  detalle_pedido_id INT NOT NULL,
  cantidad          INT NOT NULL,
  CONSTRAINT fk_dd_dev    FOREIGN KEY (devolucion_id)     REFERENCES devoluciones(id)   ON DELETE CASCADE,
  CONSTRAINT fk_dd_detped FOREIGN KEY (detalle_pedido_id) REFERENCES detalle_pedido(id) ON DELETE RESTRICT,
  CONSTRAINT chk_dd_cant CHECK (cantidad > 0)
);

-- Cupones / descuentos
CREATE TABLE cupones (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  codigo       VARCHAR(40) NOT NULL UNIQUE,
  tipo         ENUM('porcentaje','monto') NOT NULL,
  valor        DECIMAL(12,2) NOT NULL,
  valido_desde DATE,
  valido_hasta DATE,
  usos_maximos INT DEFAULT 1,
  usos_actuales INT DEFAULT 0,
  activo       BOOLEAN DEFAULT TRUE,
  CONSTRAINT chk_cupon_valor CHECK (valor > 0 AND (tipo <> 'porcentaje' OR valor <= 100)),
  CONSTRAINT chk_cupon_usos  CHECK (usos_maximos >= 1 AND usos_actuales >= 0 AND usos_actuales <= usos_maximos),
  CONSTRAINT chk_cupon_vig   CHECK (valido_desde IS NULL OR valido_hasta IS NULL OR valido_hasta >= valido_desde)
);

CREATE TABLE pedido_cupon (
  pedido_id          INT NOT NULL,
  cupon_id           INT NOT NULL,
  descuento_aplicado DECIMAL(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (pedido_id, cupon_id),
  CONSTRAINT fk_pc_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_cupon  FOREIGN KEY (cupon_id)  REFERENCES cupones(id) ON DELETE RESTRICT,
  CONSTRAINT chk_pc_desc CHECK (descuento_aplicado >= 0)
);

-- Historial de precios de ofertas (I6)
CREATE TABLE historial_precios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  oferta_id       INT NOT NULL,
  precio_anterior DECIMAL(12,2),
  precio_nuevo    DECIMAL(12,2) NOT NULL,
  usuario_id      INT NULL,                       -- quien cambio el precio
  fecha           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hp_oferta  FOREIGN KEY (oferta_id)  REFERENCES ofertas(id)  ON DELETE CASCADE,
  CONSTRAINT fk_hp_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Notificaciones a usuarios
CREATE TABLE notificaciones (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo       ENUM('pedido','pago','envio','importacion','sistema') NOT NULL,
  titulo     VARCHAR(120) NOT NULL,
  mensaje    VARCHAR(500),
  leida      BOOLEAN DEFAULT FALSE,
  fecha      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Almacenes y stock por ubicacion (solo aplica a stock propio 1P)
CREATE TABLE almacenes (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  ciudad    VARCHAR(80),
  direccion VARCHAR(200),
  activo    BOOLEAN DEFAULT TRUE
);

CREATE TABLE ubicaciones_stock (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  almacen_id INT NOT NULL,
  oferta_id  INT NOT NULL,                        -- oferta propia de Bagg
  cantidad   INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_us_almacen FOREIGN KEY (almacen_id) REFERENCES almacenes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_us_oferta  FOREIGN KEY (oferta_id)  REFERENCES ofertas(id)   ON DELETE CASCADE,
  CONSTRAINT uq_us UNIQUE (almacen_id, oferta_id),
  CONSTRAINT chk_us_cant CHECK (cantidad >= 0)
);

-- =====================================================================
-- BLOQUE D : AJUSTES DE RELACIONES Y COLUMNAS
-- =====================================================================

-- I3: ligar cada linea de pedido al envio en que viajo (multi-vendedor 3P)
-- I4: congelar el costo unitario para que el margen historico no derive
ALTER TABLE detalle_pedido
  ADD COLUMN envio_id      INT NULL AFTER oferta_id,
  ADD COLUMN costo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER precio_unitario,
  ADD CONSTRAINT fk_dp_envio FOREIGN KEY (envio_id) REFERENCES envios(id) ON DELETE SET NULL;

-- Evidencia de pago
ALTER TABLE pagos ADD COLUMN comprobante_url VARCHAR(255) NULL AFTER referencia;

-- I5: moneda y tipo de cambio a nivel de pedido
ALTER TABLE pedidos
  ADD COLUMN moneda      ENUM('BOB','USD') DEFAULT 'BOB' AFTER total,
  ADD COLUMN tipo_cambio DECIMAL(10,4) NOT NULL DEFAULT 1 AFTER moneda;

-- M2: marca de actualizacion en tablas mutables
ALTER TABLE ofertas   ADD COLUMN actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE productos ADD COLUMN actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE pedidos   ADD COLUMN actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- =====================================================================
-- BLOQUE F1 : CORRECCION DE SEMILLA - STOCK  (C4)
--   Cuadra ofertas.stock (propias) con el saldo del kardex ANTES de crear
--   los triggers, para no doble-contar los movimientos ya cargados.
--   Resultado esperado: oferta 1 -> 24, oferta 3 -> 78 (estaban 25 y 80).
-- =====================================================================

UPDATE ofertas o
SET o.stock = (
  SELECT COALESCE(SUM(CASE m.tipo WHEN 'salida' THEN -m.cantidad ELSE m.cantidad END), 0)
  FROM movimientos_inventario m
  WHERE m.oferta_id = o.id
)
WHERE o.tipo_venta = 'propio'
  AND EXISTS (SELECT 1 FROM movimientos_inventario m2 WHERE m2.oferta_id = o.id);

-- I4: backfill del costo congelado en lineas historicas (marketplace -> 0)
UPDATE detalle_pedido dp
JOIN ofertas o ON o.id = dp.oferta_id
SET dp.costo_unitario = o.precio_compra;

-- =====================================================================
-- BLOQUE E : TRIGGERS  (C4 + C5)  -- fuente unica de stock en la propia DB
-- =====================================================================
DELIMITER //

-- C5: un movimiento de inventario solo puede afectar una oferta 'propio'
CREATE TRIGGER trg_mov_before_insert
BEFORE INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
  DECLARE v_tipo ENUM('propio','marketplace');
  SELECT tipo_venta INTO v_tipo FROM ofertas WHERE id = NEW.oferta_id;
  IF v_tipo IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'movimientos_inventario: la oferta no existe';
  ELSEIF v_tipo <> 'propio' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'movimientos_inventario solo aplica a ofertas propias (1P)';
  END IF;
  IF NEW.cantidad <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'movimientos_inventario: la cantidad debe ser > 0';
  END IF;
END//

-- C4: ofertas.stock es el saldo; cada movimiento lo ajusta automaticamente.
--   entrada => +cantidad ; salida => -cantidad ; ajuste => +cantidad (delta firmado por convencion).
CREATE TRIGGER trg_mov_after_insert
AFTER INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
  IF NEW.tipo = 'salida' THEN
    UPDATE ofertas SET stock = stock - NEW.cantidad WHERE id = NEW.oferta_id;
  ELSE
    UPDATE ofertas SET stock = stock + NEW.cantidad WHERE id = NEW.oferta_id;
  END IF;
END//

DELIMITER ;

-- =====================================================================
-- BLOQUE F2 : DATOS DE PRUEBA ADICIONALES
--   Cubre: pedido mixto 1P/3P con 2 envios, estados pago/pedido faltantes
--   (pendiente, rechazado, cancelado) y ejercita los triggers.
--   Los ids son deterministas en una carga limpia (envios 1-2 ya existen).
-- =====================================================================

-- PEDIDO 3: MIXTO 1P + 3P (Carlos). Linea propia (oferta 3) + marketplace (oferta 7 de Hnos. Salazar)
--   subtotal 545 = 35x1 + 510x1 ; envio 30 ; total 575 ; comision 3P = 510x10% = 51
INSERT INTO pedidos (codigo, usuario_id, direccion_envio_id, subtotal, costo_envio, costo_importacion, total, moneda, tipo_cambio, estado) VALUES
  ('BAGG-2026-0003', 4, 1, 545.00, 30.00, 0.00, 575.00, 'BOB', 1.00, 'en_preparacion');
-- 2 envios: id 3 = Bagg (linea propia), id 4 = proveedor 3 (linea marketplace)
INSERT INTO envios (pedido_id, vendedor_id, transportadora, costo, tracking, estado, fecha_envio) VALUES
  (3, NULL, 'Servicio Express CBBA', 30.00, 'ENV-0003', 'preparando', NULL),  -- id 3
  (3, 3,    'Salazar Logistica',      0.00, 'ENV-0004', 'preparando', NULL);  -- id 4
-- lineas ligadas a su envio (I3) y con costo congelado (I4)
INSERT INTO detalle_pedido (pedido_id, oferta_id, envio_id, cantidad, precio_unitario, costo_unitario, comision) VALUES
  (3, 3, 3, 1,  35.00, 22.00,  0.00),   -- 1P: costo 22 (de la oferta 3)
  (3, 7, 4, 1, 510.00,  0.00, 51.00);   -- 3P: comision 51
INSERT INTO pagos (pedido_id, metodo, monto, referencia, comprobante_url, estado) VALUES
  (3, 'transferencia', 575.00, 'TRF-2026-0003', '/docs/pagos/trf-0003.pdf', 'aprobado');
INSERT INTO pedido_estado_historial (pedido_id, estado_anterior, estado_nuevo, usuario_id, comentario) VALUES
  (3, 'pendiente', 'pagado', 3, 'Pago verificado'),
  (3, 'pagado', 'en_preparacion', 3, 'Pedido en alistamiento');
-- movimiento 1P -> el trigger descuenta oferta 3 (78 -> 77)
INSERT INTO movimientos_inventario (oferta_id, tipo, cantidad, motivo) VALUES
  (3, 'salida', 1, 'venta BAGG-2026-0003');

-- PEDIDO 4: CANCELADO + pago RECHAZADO (Lucia). Cubre esos dos estados.
INSERT INTO pedidos (codigo, usuario_id, direccion_envio_id, subtotal, costo_envio, costo_importacion, total, moneda, tipo_cambio, estado) VALUES
  ('BAGG-2026-0004', 5, 2, 48.00, 0.00, 0.00, 48.00, 'BOB', 1.00, 'cancelado');
INSERT INTO detalle_pedido (pedido_id, oferta_id, envio_id, cantidad, precio_unitario, costo_unitario, comision) VALUES
  (4, 5, NULL, 1, 48.00, 22.00, 0.00);   -- oferta 5 propia; sin envio (cancelado)
INSERT INTO pagos (pedido_id, metodo, monto, referencia, estado) VALUES
  (4, 'tarjeta', 48.00, 'TJ-2026-0004', 'rechazado');
INSERT INTO pedido_estado_historial (pedido_id, estado_anterior, estado_nuevo, usuario_id, comentario) VALUES
  (4, 'pendiente', 'cancelado', NULL, 'Pago rechazado por la pasarela');

-- PEDIDO 5: PENDIENTE + pago PENDIENTE (Carlos). Cubre el estado inicial; sin movimiento (stock se reserva al confirmar).
INSERT INTO pedidos (codigo, usuario_id, direccion_envio_id, subtotal, costo_envio, costo_importacion, total, moneda, tipo_cambio, estado) VALUES
  ('BAGG-2026-0005', 4, 1, 35.00, 25.00, 0.00, 60.00, 'BOB', 1.00, 'pendiente');
INSERT INTO detalle_pedido (pedido_id, oferta_id, envio_id, cantidad, precio_unitario, costo_unitario, comision) VALUES
  (5, 3, NULL, 1, 35.00, 22.00, 0.00);
INSERT INTO pagos (pedido_id, metodo, monto, referencia, estado) VALUES
  (5, 'qr', 60.00, 'QR-2026-0005', 'pendiente');

-- Semilla minima de las nuevas tablas (demostrativa)
INSERT INTO facturas (pedido_id, numero, nit_cliente, razon_social, subtotal, impuesto, total) VALUES
  (1, 'FAC-2026-0001', '4567890 CB', 'Carlos Rojas', 273.91, 41.09, 315.00);   -- IVA 13% aprox sobre el total
INSERT INTO almacenes (nombre, ciudad, direccion) VALUES
  ('Deposito Central', 'Cochabamba', 'Av. Blanco Galindo km 5');
INSERT INTO ubicaciones_stock (almacen_id, oferta_id, cantidad) VALUES
  (1, 1, 24), (1, 3, 77), (1, 5, 40), (1, 6, 14);   -- refleja el stock propio reconciliado
INSERT INTO cupones (codigo, tipo, valor, valido_desde, valido_hasta, usos_maximos) VALUES
  ('BIENVENIDO10', 'porcentaje', 10.00, '2026-01-01', '2026-12-31', 100);
INSERT INTO historial_precios (oferta_id, precio_anterior, precio_nuevo, usuario_id) VALUES
  (1, 210.00, 220.00, 2);   -- el gerente subio el precio de la oferta 1
INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) VALUES
  (4, 'pedido', 'Pedido en preparacion', 'Tu pedido BAGG-2026-0003 esta siendo preparado.');

-- =====================================================================
-- BLOQUE G : CONSULTAS DE VALIDACION  (aceptacion del parche)
--   Las consultas marcadas [DEBE=0] tienen que devolver 0 filas tras aplicar
--   el parche; son las pruebas de que el modelo quedo consistente.
-- =====================================================================

-- [DEBE=0] Ofertas inconsistentes con el modelo 1P/3P
SELECT 'ofertas_inconsistentes' AS chequeo, o.* FROM ofertas o
WHERE (o.tipo_venta = 'propio'      AND (o.vendedor_id IS NOT NULL OR o.precio_compra <= 0))
   OR (o.tipo_venta = 'marketplace' AND (o.vendedor_id IS NULL     OR o.comision_pct  <= 0));

-- [DEBE=0] Stock (campo) vs kardex (libro) en ofertas propias
SELECT 'stock_vs_kardex' AS chequeo, o.id, o.stock,
       COALESCE(SUM(CASE m.tipo WHEN 'salida' THEN -m.cantidad ELSE m.cantidad END), 0) AS libro
FROM ofertas o
LEFT JOIN movimientos_inventario m ON m.oferta_id = o.id
WHERE o.tipo_venta = 'propio'
GROUP BY o.id, o.stock
HAVING o.stock <> libro;

-- [DEBE=0] Usuarios sin ningun rol
SELECT 'usuarios_sin_rol' AS chequeo, u.id, u.email
FROM usuarios u LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
WHERE ur.usuario_id IS NULL;

-- Bajo stock (productos propios a reponer)
SELECT 'bajo_stock' AS reporte, o.id, p.codigo, o.stock, o.stock_minimo
FROM ofertas o JOIN productos p ON p.id = o.producto_id
WHERE o.tipo_venta = 'propio' AND o.stock <= o.stock_minimo;

-- Ingreso de Bagg separado por margen (1P) vs comision (3P)
SELECT 'ingreso_bagg' AS reporte, o.tipo_venta,
       SUM(CASE WHEN o.tipo_venta = 'propio'
                THEN (dp.precio_unitario - dp.costo_unitario) * dp.cantidad
                ELSE dp.comision END) AS ingreso
FROM detalle_pedido dp
JOIN ofertas o ON o.id = dp.oferta_id
JOIN pedidos pe ON pe.id = dp.pedido_id
WHERE pe.estado <> 'cancelado'
GROUP BY o.tipo_venta;

-- Pedidos por cliente
SELECT 'pedidos_por_cliente' AS reporte, u.nombre, COUNT(*) AS pedidos
FROM pedidos pe JOIN usuarios u ON u.id = pe.usuario_id
GROUP BY u.id, u.nombre;

-- Pedidos despachados por proveedor (3P)
SELECT 'pedidos_por_proveedor' AS reporte, pr.nombre, COUNT(DISTINCT en.pedido_id) AS pedidos
FROM envios en JOIN proveedores pr ON pr.id = en.vendedor_id
GROUP BY pr.id, pr.nombre;

-- Importaciones pendientes (no entregadas)
SELECT 'importaciones_pendientes' AS reporte, g.id, g.estado_aduana,
       COALESCE(CONCAT('pedido ', g.pedido_id), CONCAT('compra ', g.compra_id)) AS origen
FROM gestiones_importacion g
WHERE g.estado_aduana <> 'entregado';

-- Gestiones sin DUI/DIM (documento aduanero faltante)
SELECT 'docs_faltantes' AS reporte, g.id
FROM gestiones_importacion g
WHERE NOT EXISTS (SELECT 1 FROM documentos_importacion d WHERE d.gestion_id = g.id AND d.tipo = 'dui_dim');

-- Pagos pendientes (pedido no cancelado sin cobro completo aprobado)
SELECT 'pagos_pendientes' AS reporte, pe.codigo, pe.total,
       COALESCE(SUM(CASE WHEN pg.estado = 'aprobado' THEN pg.monto END), 0) AS pagado
FROM pedidos pe
LEFT JOIN pagos pg ON pg.pedido_id = pe.id
WHERE pe.estado <> 'cancelado'
GROUP BY pe.id, pe.codigo, pe.total
HAVING pagado < pe.total;

-- =====================================================================
-- FIN DEL PARCHE
-- Pruebas negativas sugeridas (deben FALLAR si el parche quedo bien):
--   INSERT INTO ofertas (producto_id,vendedor_id,tipo_venta,precio,comision_pct)
--     VALUES (1, 4, 'propio', 100, 0);                      -- viola chk_oferta_modelo
--   INSERT INTO gestiones_importacion (pedido_id,compra_id) VALUES (1, 1);  -- viola chk_gi_origen (XOR)
--   INSERT INTO movimientos_inventario (oferta_id,tipo,cantidad) VALUES (2,'entrada',5); -- oferta marketplace -> trigger
--   INSERT INTO detalle_pedido (pedido_id,oferta_id,cantidad,precio_unitario) VALUES (1,1,0,10); -- viola chk_dp_cant
-- =====================================================================
