-- =====================================================================
-- BAGG AUTOPARTES  -  Base de Datos (version consolidada)
-- E-commerce de autopartes con dos modelos de venta:
--   1P  -> Bagg vende de su propio stock (gana por margen)
--   3P  -> Marketplace: un proveedor vende y Bagg intermedia (gana por comision)
-- Bagg gestiona ademas aduana, documentacion y seguro de cada importacion.
-- Motor: MySQL 8 / MariaDB 10.4+   |   Charset: utf8mb4
-- =====================================================================

DROP DATABASE IF EXISTS bagg_autopartes;
CREATE DATABASE bagg_autopartes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bagg_autopartes;

-- =====================================================================
-- 1. USUARIOS, ROLES Y ACCESO
--    usuarios = TODOS los que interactuan con el sistema.
--    El rol define que interfaz ve cada actor (relacion muchos-a-muchos:
--    una misma cuenta puede ser, por ejemplo, cliente y proveedor a la vez).
-- =====================================================================

CREATE TABLE roles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(150)
);

CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  apellido      VARCHAR(100),
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  telefono      VARCHAR(30),
  ci_nit        VARCHAR(30),                 -- CI / NIT (Bolivia)
  estado        ENUM('activo','inactivo','bloqueado') DEFAULT 'activo',
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario_rol (
  usuario_id INT NOT NULL,
  rol_id     INT NOT NULL,
  PRIMARY KEY (usuario_id, rol_id),
  CONSTRAINT fk_ur_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_rol     FOREIGN KEY (rol_id)     REFERENCES roles(id)
);

CREATE TABLE direcciones (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT NOT NULL,
  etiqueta     VARCHAR(50),
  departamento VARCHAR(60),
  ciudad       VARCHAR(80),
  direccion    VARCHAR(200) NOT NULL,
  referencia   VARCHAR(200),
  es_principal BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_dir_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =====================================================================
-- 2. CATALOGO (definicion canonica de la pieza)
--    productos describe QUE es la pieza; el precio y el stock viven en
--    "ofertas", porque una misma pieza puede ser ofrecida por Bagg y/o
--    por varios proveedores a la vez.
-- =====================================================================

CREATE TABLE categorias (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  nombre             VARCHAR(100) NOT NULL,
  descripcion        VARCHAR(255),
  categoria_padre_id INT NULL,
  CONSTRAINT fk_cat_padre FOREIGN KEY (categoria_padre_id) REFERENCES categorias(id)
);

CREATE TABLE marcas_vehiculo (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(80) NOT NULL UNIQUE,
  pais_origen VARCHAR(80)
);

CREATE TABLE modelos_vehiculo (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  marca_vehiculo_id INT NOT NULL,
  nombre            VARCHAR(100) NOT NULL,
  anio_inicio       SMALLINT,
  anio_fin          SMALLINT,
  CONSTRAINT fk_modelo_marca FOREIGN KEY (marca_vehiculo_id) REFERENCES marcas_vehiculo(id)
);

CREATE TABLE marcas_pieza (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE productos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  codigo         VARCHAR(50)  NOT NULL UNIQUE,   -- numero de parte / SKU base
  nombre         VARCHAR(150) NOT NULL,
  descripcion    TEXT,
  categoria_id   INT NOT NULL,
  marca_pieza_id INT,
  peso_kg        DECIMAL(8,3),
  activo         BOOLEAN DEFAULT TRUE,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prod_categoria FOREIGN KEY (categoria_id)   REFERENCES categorias(id),
  CONSTRAINT fk_prod_marca     FOREIGN KEY (marca_pieza_id) REFERENCES marcas_pieza(id)
);

CREATE TABLE producto_imagenes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT NOT NULL,
  url          VARCHAR(255) NOT NULL,
  es_principal BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_img_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Compatibilidad pieza <-> modelo de vehiculo (clave del buscador por auto)
CREATE TABLE compatibilidades (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  producto_id        INT NOT NULL,
  modelo_vehiculo_id INT NOT NULL,
  anio_desde         SMALLINT,
  anio_hasta         SMALLINT,
  CONSTRAINT fk_comp_producto FOREIGN KEY (producto_id)        REFERENCES productos(id) ON DELETE CASCADE,
  CONSTRAINT fk_comp_modelo   FOREIGN KEY (modelo_vehiculo_id) REFERENCES modelos_vehiculo(id),
  CONSTRAINT uq_comp UNIQUE (producto_id, modelo_vehiculo_id)
);

-- =====================================================================
-- 3. PROVEEDORES
--    Pueden tener (opcionalmente) una cuenta de login para su interfaz.
--    usuario_id NULL = proveedor sin portal.
-- =====================================================================

CREATE TABLE proveedores (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL UNIQUE,                  -- cuenta de acceso (opcional)
  nombre     VARCHAR(150) NOT NULL,
  tipo       ENUM('empresa','particular') DEFAULT 'empresa',
  pais       VARCHAR(80),
  contacto   VARCHAR(100),
  telefono   VARCHAR(30),
  email      VARCHAR(150),
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prov_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =====================================================================
-- 4. OFERTAS (quien vende cada pieza, a que precio y con cuanto stock)
--    tipo_venta = 'propio'      -> stock de Bagg, ingreso = margen
--    tipo_venta = 'marketplace' -> vende un proveedor, ingreso = comision
-- =====================================================================

CREATE TABLE ofertas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  producto_id   INT NOT NULL,
  vendedor_id   INT NULL,                       -- proveedor; NULL = Bagg (stock propio)
  tipo_venta    ENUM('propio','marketplace') NOT NULL,
  condicion     ENUM('nuevo','usado','reacondicionado') DEFAULT 'nuevo',
  origen        ENUM('nacional','importado') DEFAULT 'nacional',
  precio_compra DECIMAL(12,2) DEFAULT 0,         -- costo (solo aplica a 'propio')
  precio        DECIMAL(12,2) NOT NULL,          -- precio al cliente
  moneda        ENUM('BOB','USD') DEFAULT 'BOB',
  comision_pct  DECIMAL(5,2) DEFAULT 0,          -- % de Bagg (solo aplica a 'marketplace')
  stock         INT DEFAULT 0,
  stock_minimo  INT DEFAULT 0,
  activo        BOOLEAN DEFAULT TRUE,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_oferta_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_oferta_vendedor FOREIGN KEY (vendedor_id) REFERENCES proveedores(id)
);

-- =====================================================================
-- 5. ABASTECIMIENTO (compras de Bagg para su propio stock - modelo 1P)
-- =====================================================================

CREATE TABLE compras (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT NOT NULL,
  tipo         ENUM('nacional','importacion') DEFAULT 'nacional',
  fecha        DATE NOT NULL,
  moneda       ENUM('BOB','USD') DEFAULT 'BOB',
  tipo_cambio  DECIMAL(10,4) DEFAULT 1,
  subtotal     DECIMAL(12,2) DEFAULT 0,
  total        DECIMAL(12,2) DEFAULT 0,
  estado       ENUM('borrador','confirmada','recibida','cancelada') DEFAULT 'borrador',
  CONSTRAINT fk_compra_prov FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

CREATE TABLE detalle_compra (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  compra_id      INT NOT NULL,
  producto_id    INT NOT NULL,
  cantidad       INT NOT NULL,
  costo_unitario DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_dc_compra   FOREIGN KEY (compra_id)   REFERENCES compras(id) ON DELETE CASCADE,
  CONSTRAINT fk_dc_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =====================================================================
-- 6. VENTAS (carrito, pedidos, pagos, envios)
--    Un pedido puede ser multi-vendedor -> varios envios (1:N), uno por
--    vendedor, cada uno con su propio tracking.
-- =====================================================================

CREATE TABLE carritos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_carrito_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE carrito_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  carrito_id INT NOT NULL,
  oferta_id  INT NOT NULL,
  cantidad   INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_ci_carrito FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_oferta  FOREIGN KEY (oferta_id)  REFERENCES ofertas(id),
  CONSTRAINT uq_carrito_item UNIQUE (carrito_id, oferta_id)
);

CREATE TABLE pedidos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  codigo             VARCHAR(30) NOT NULL UNIQUE,   -- BAGG-2026-0001
  usuario_id         INT NOT NULL,                  -- cliente
  direccion_envio_id INT,
  fecha              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subtotal           DECIMAL(12,2) DEFAULT 0,       -- suma de las lineas
  costo_envio        DECIMAL(12,2) DEFAULT 0,
  costo_importacion  DECIMAL(12,2) DEFAULT 0,       -- gestion + aduana + seguro cobrados
  total              DECIMAL(12,2) DEFAULT 0,
  estado             ENUM('pendiente','pagado','en_preparacion','enviado','entregado','cancelado') DEFAULT 'pendiente',
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (usuario_id)         REFERENCES usuarios(id),
  CONSTRAINT fk_pedido_dir     FOREIGN KEY (direccion_envio_id) REFERENCES direcciones(id)
);

CREATE TABLE detalle_pedido (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INT NOT NULL,
  oferta_id       INT NOT NULL,
  cantidad        INT NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,           -- "congela" el precio de la oferta
  comision        DECIMAL(12,2) DEFAULT 0,          -- "congela" la comision de Bagg (3P)
  CONSTRAINT fk_dp_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_dp_oferta FOREIGN KEY (oferta_id) REFERENCES ofertas(id)
);

CREATE TABLE pagos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id  INT NOT NULL,
  metodo     ENUM('qr','transferencia','tarjeta','efectivo') NOT NULL,
  monto      DECIMAL(12,2) NOT NULL,
  referencia VARCHAR(100),
  estado     ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
  fecha      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pago_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE TABLE envios (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id      INT NOT NULL,
  vendedor_id    INT NULL,                          -- proveedor que despacha; NULL = Bagg
  transportadora VARCHAR(100),
  costo          DECIMAL(12,2) DEFAULT 0,
  tracking       VARCHAR(80),
  estado         ENUM('preparando','en_camino','entregado') DEFAULT 'preparando',
  fecha_envio    DATE,
  fecha_entrega  DATE,
  CONSTRAINT fk_envio_pedido   FOREIGN KEY (pedido_id)   REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_envio_vendedor FOREIGN KEY (vendedor_id) REFERENCES proveedores(id)
);

-- =====================================================================
-- 7. GESTION DE IMPORTACION (el servicio que distingue a Bagg)
--    Aduana + documentacion + seguro. Puede colgar de:
--      - un PEDIDO  (3P: el cliente compro a un proveedor del exterior), o
--      - una COMPRA (1P: Bagg importo para su propio stock).
-- =====================================================================

CREATE TABLE gestiones_importacion (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id        INT NULL,
  compra_id        INT NULL,
  pais_origen      VARCHAR(80),
  via              ENUM('aerea','maritima','terrestre') DEFAULT 'aerea',
  fecha_embarque   DATE,
  fecha_llegada    DATE,
  estado_aduana    ENUM('pendiente','en_transito','en_aduana','nacionalizado','entregado') DEFAULT 'pendiente',
  costo_gestion    DECIMAL(12,2) DEFAULT 0,          -- honorario de Bagg por gestionar
  impuestos_aduana DECIMAL(12,2) DEFAULT 0,
  monto_asegurado  DECIMAL(12,2) DEFAULT 0,          -- valor cubierto por el seguro
  costo_seguro     DECIMAL(12,2) DEFAULT 0,
  tracking         VARCHAR(80),
  CONSTRAINT fk_gi_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  CONSTRAINT fk_gi_compra FOREIGN KEY (compra_id) REFERENCES compras(id),
  CONSTRAINT chk_gi_origen CHECK (pedido_id IS NOT NULL OR compra_id IS NOT NULL)
);

CREATE TABLE documentos_importacion (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  gestion_id INT NOT NULL,
  tipo       ENUM('factura_comercial','packing_list','bl_awb','dui_dim','poliza_seguro','otro') NOT NULL,
  numero     VARCHAR(80),
  url        VARCHAR(255),
  fecha      DATE,
  CONSTRAINT fk_doc_gestion FOREIGN KEY (gestion_id) REFERENCES gestiones_importacion(id) ON DELETE CASCADE
);

-- =====================================================================
-- 8. RESENIAS E INVENTARIO
--    El stock vive en ofertas; los movimientos solo aplican a las ofertas
--    propias de Bagg (en marketplace el stock lo controla el proveedor).
-- =====================================================================

CREATE TABLE resenias (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT NOT NULL,
  usuario_id   INT NOT NULL,
  calificacion TINYINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario   TEXT,
  fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id),
  CONSTRAINT uq_resenia UNIQUE (producto_id, usuario_id)
);

CREATE TABLE movimientos_inventario (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  oferta_id INT NOT NULL,
  tipo      ENUM('entrada','salida','ajuste') NOT NULL,
  cantidad  INT NOT NULL,
  motivo    VARCHAR(100),
  fecha     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_oferta FOREIGN KEY (oferta_id) REFERENCES ofertas(id)
);

-- =====================================================================
-- 9. DATOS DE EJEMPLO
-- =====================================================================

INSERT INTO roles (nombre, descripcion) VALUES
  ('administrador', 'Control total del sistema y configuracion'),
  ('gerente',       'Supervision del negocio: aprueba, fija precios y ve analitica'),
  ('operador',      'Operacion diaria: catalogo, inventario, compras y pedidos'),
  ('cliente',       'Compra en la tienda'),
  ('proveedor',     'Vende/abastece piezas; tiene su propia interfaz');

INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, ci_nit) VALUES
  ('Arbit',  'Mamani',  'admin@baggautopartes.bo',      '$2y$10$hashdemo01', '70011223', '1234567 CB'),
  ('Marcos', 'Flores',  'gerencia@baggautopartes.bo',   '$2y$10$hashdemo02', '70022334', '2233445 CB'),
  ('Sofia',  'Quispe',  'operaciones@baggautopartes.bo','$2y$10$hashdemo03', '70033445', '3344556 CB'),
  ('Carlos', 'Rojas',   'carlos.rojas@gmail.com',       '$2y$10$hashdemo04', '71234567', '4567890 CB'),
  ('Lucia',  'Vargas',  'lucia.vargas@gmail.com',       '$2y$10$hashdemo05', '76543210', '7654321 LP'),
  ('Pedro',  'Salazar', 'ventas@hnossalazar.bo',        '$2y$10$hashdemo06', '60012345', '5566778 CB'),
  ('Jorge',  'Ticona',  'jorge.ticona@gmail.com',       '$2y$10$hashdemo07', '69988776', '8877665 CB');

-- Roles por usuario. Nota: Jorge (id 7) es cliente Y proveedor a la vez.
INSERT INTO usuario_rol (usuario_id, rol_id) VALUES
  (1,1), (2,2), (3,3), (4,4), (5,4), (6,5), (7,4), (7,5);

INSERT INTO direcciones (usuario_id, etiqueta, departamento, ciudad, direccion, referencia, es_principal) VALUES
  (4, 'Casa',    'Cochabamba', 'Cochabamba', 'Av. America #1234',        'Frente a la plaza',  TRUE),
  (5, 'Trabajo', 'La Paz',     'La Paz',     'Calle Comercio #56',       'Edificio Torre Sur', TRUE),
  (7, 'Taller',  'Cochabamba', 'Cochabamba', 'Av. Blanco Galindo km 4',  'Junto al surtidor',  TRUE);

INSERT INTO categorias (nombre, descripcion, categoria_padre_id) VALUES
  ('Motor',      'Componentes del motor',     NULL),
  ('Frenos',     'Sistema de frenado',        NULL),
  ('Suspension', 'Amortiguacion y direccion', NULL),
  ('Electrico',  'Sistema electrico',         NULL),
  ('Filtros',    'Filtros varios',            1);

INSERT INTO marcas_vehiculo (nombre, pais_origen) VALUES
  ('Toyota', 'Japon'), ('Nissan', 'Japon'), ('Suzuki', 'Japon');

INSERT INTO modelos_vehiculo (marca_vehiculo_id, nombre, anio_inicio, anio_fin) VALUES
  (1, 'Corolla', 2010, 2020),
  (1, 'Hilux',   2012, 2023),
  (2, 'Sentra',  2013, 2022),
  (3, 'Vitara',  2015, 2024);

INSERT INTO marcas_pieza (nombre) VALUES
  ('Bosch'), ('Denso'), ('NGK'), ('Sakura');

INSERT INTO productos (codigo, nombre, descripcion, categoria_id, marca_pieza_id, peso_kg) VALUES
  ('FRN-001', 'Pastillas de freno delanteras', 'Juego de pastillas ceramicas', 2, 1, 1.200),
  ('FLT-002', 'Filtro de aceite',              'Filtro de aceite estandar',    5, 4, 0.300),
  ('ELE-003', 'Bujia de encendido',            'Bujia de iridio',              4, 3, 0.080),
  ('SUS-004', 'Amortiguador delantero',        'Amortiguador a gas',           3, 1, 3.500),
  ('ELE-005', 'Bateria 12V 60Ah',              'Bateria libre mantenimiento',  4, 2, 14.000);

INSERT INTO producto_imagenes (producto_id, url, es_principal) VALUES
  (1, '/img/productos/frn-001.jpg', TRUE),
  (3, '/img/productos/ele-003.jpg', TRUE),
  (5, '/img/productos/ele-005.jpg', TRUE);

INSERT INTO compatibilidades (producto_id, modelo_vehiculo_id, anio_desde, anio_hasta) VALUES
  (1, 1, 2010, 2018),
  (1, 3, 2013, 2020),
  (2, 1, 2010, 2020),
  (2, 2, 2012, 2023),
  (3, 4, 2015, 2024),
  (4, 2, 2012, 2023),
  (5, 1, 2010, 2020);

-- Proveedores. 3 y 4 tienen cuenta de login (interfaz de proveedor).
INSERT INTO proveedores (usuario_id, nombre, tipo, pais, contacto, telefono, email) VALUES
  (NULL, 'AutoParts Import SRL', 'empresa',    'China',   'Wei Chen',      '+86 138000000', 'sales@apimport.cn'),
  (NULL, 'Repuestos Andinos',    'empresa',    'Bolivia', 'Mario Pinto',   '4-4567890',     'ventas@andinos.bo'),
  (6,    'Hnos. Salazar',        'empresa',    'Bolivia', 'Pedro Salazar', '60012345',      'ventas@hnossalazar.bo'),
  (7,    'Jorge Ticona',         'particular', 'Bolivia', 'Jorge Ticona',  '69988776',      'jorge.ticona@gmail.com');

-- OFERTAS  (ids 1..7)
-- producto 1: oferta propia de Bagg (1) y oferta marketplace de Jorge (2)
-- producto 3: oferta marketplace de AutoParts Import (4) y propia de Bagg (5)
INSERT INTO ofertas (producto_id, vendedor_id, tipo_venta, condicion, origen, precio_compra, precio, comision_pct, stock, stock_minimo) VALUES
  (1, NULL, 'propio',      'nuevo', 'importado', 120.00, 220.00,  0, 25, 5),   -- 1
  (1, 4,    'marketplace', 'usado', 'nacional',    0.00, 200.00, 12, 10, 0),   -- 2
  (2, NULL, 'propio',      'nuevo', 'nacional',   18.00,  35.00,  0, 80, 10),  -- 3
  (3, 1,    'marketplace', 'nuevo', 'importado',   0.00,  45.00, 15, 60, 0),   -- 4
  (3, NULL, 'propio',      'nuevo', 'nacional',   22.00,  48.00,  0, 40, 10),  -- 5
  (4, NULL, 'propio',      'nuevo', 'importado', 280.00, 480.00,  0, 14, 4),   -- 6
  (5, 3,    'marketplace', 'nuevo', 'nacional',    0.00, 510.00, 10, 18, 0);   -- 7

-- COMPRAS de Bagg para su stock propio
-- Compra 1: importacion desde China (alimenta ofertas 1 y 6)
INSERT INTO compras (proveedor_id, tipo, fecha, moneda, tipo_cambio, subtotal, total, estado) VALUES
  (1, 'importacion', '2026-03-01', 'USD', 6.96, 2000.00, 13920.00, 'recibida');
INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario) VALUES
  (1, 1, 25, 17.24),
  (1, 4, 14, 40.23);

-- Compra 2: nacional (alimenta ofertas 3 y 5)
INSERT INTO compras (proveedor_id, tipo, fecha, moneda, tipo_cambio, subtotal, total, estado) VALUES
  (2, 'nacional', '2026-04-10', 'BOB', 1.00, 2400.00, 2400.00, 'recibida');
INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario) VALUES
  (2, 2, 80, 18.00),
  (2, 3, 40, 22.00);

-- Carrito pendiente de Lucia (oferta marketplace de bateria)
INSERT INTO carritos (usuario_id) VALUES (5);
INSERT INTO carrito_items (carrito_id, oferta_id, cantidad) VALUES
  (1, 7, 1);

-- PEDIDO 1: Carlos compra solo stock propio de Bagg (modelo 1P, sin importacion)
-- subtotal 290 = 220x1 + 35x2 ; envio 25 ; total 315
INSERT INTO pedidos (codigo, usuario_id, direccion_envio_id, subtotal, costo_envio, costo_importacion, total, estado) VALUES
  ('BAGG-2026-0001', 4, 1, 290.00, 25.00, 0.00, 315.00, 'enviado');
INSERT INTO detalle_pedido (pedido_id, oferta_id, cantidad, precio_unitario, comision) VALUES
  (1, 1, 1, 220.00, 0.00),
  (1, 3, 2,  35.00, 0.00);
INSERT INTO pagos (pedido_id, metodo, monto, referencia, estado) VALUES
  (1, 'qr', 315.00, 'QR-2026-0001', 'aprobado');
INSERT INTO envios (pedido_id, vendedor_id, transportadora, costo, tracking, estado, fecha_envio) VALUES
  (1, NULL, 'Servicio Express CBBA', 25.00, 'ENV-0001', 'en_camino', '2026-05-20');

-- PEDIDO 2: Lucia compra una pieza marketplace importada (oferta 4, de AutoParts Import)
-- Bagg gestiona la importacion: aduana, documentos y seguro.
-- subtotal 180 = 45x4 ; comision Bagg = 180 * 15% = 27
-- costo_importacion 215 = gestion 80 + aduana 120 + seguro 15 ; total 395
INSERT INTO pedidos (codigo, usuario_id, direccion_envio_id, subtotal, costo_envio, costo_importacion, total, estado) VALUES
  ('BAGG-2026-0002', 5, 2, 180.00, 0.00, 215.00, 395.00, 'en_preparacion');
INSERT INTO detalle_pedido (pedido_id, oferta_id, cantidad, precio_unitario, comision) VALUES
  (2, 4, 4, 45.00, 27.00);
INSERT INTO pagos (pedido_id, metodo, monto, referencia, estado) VALUES
  (2, 'transferencia', 395.00, 'TRF-2026-0002', 'aprobado');
INSERT INTO envios (pedido_id, vendedor_id, transportadora, costo, tracking, estado) VALUES
  (2, 1, 'Courier Internacional', 0.00, 'ENV-0002', 'preparando');

-- GESTIONES DE IMPORTACION
-- 1) sobre la compra propia de Bagg (1P)
INSERT INTO gestiones_importacion
  (compra_id, pais_origen, via, fecha_embarque, fecha_llegada, estado_aduana, costo_gestion, impuestos_aduana, monto_asegurado, costo_seguro, tracking) VALUES
  (1, 'China', 'maritima', '2026-02-05', '2026-03-01', 'nacionalizado', 0.00, 1500.00, 14000.00, 120.00, 'TRK-CN-001');
-- 2) sobre el pedido de Lucia (3P)
INSERT INTO gestiones_importacion
  (pedido_id, pais_origen, via, fecha_embarque, estado_aduana, costo_gestion, impuestos_aduana, monto_asegurado, costo_seguro, tracking) VALUES
  (2, 'China', 'aerea', '2026-05-18', 'en_aduana', 80.00, 120.00, 180.00, 15.00, 'TRK-CN-002');

INSERT INTO documentos_importacion (gestion_id, tipo, numero, url, fecha) VALUES
  (1, 'factura_comercial', 'FC-AP-7781',   '/docs/imp/1/factura.pdf', '2026-02-04'),
  (1, 'bl_awb',            'BL-99812',      '/docs/imp/1/bl.pdf',      '2026-02-05'),
  (1, 'dui_dim',           'DUI-2026-3312', '/docs/imp/1/dui.pdf',     '2026-02-28'),
  (2, 'factura_comercial', 'FC-AP-8042',    '/docs/imp/2/factura.pdf', '2026-05-17'),
  (2, 'packing_list',      'PL-8042',       '/docs/imp/2/packing.pdf', '2026-05-17'),
  (2, 'dui_dim',           'DUI-2026-4101', '/docs/imp/2/dui.pdf',     '2026-05-22'),
  (2, 'poliza_seguro',     'POL-556677',    '/docs/imp/2/poliza.pdf',  '2026-05-17');

INSERT INTO resenias (producto_id, usuario_id, calificacion, comentario) VALUES
  (1, 4, 5, 'Excelentes pastillas, frenado preciso.');

-- Movimientos solo de ofertas propias de Bagg (el marketplace no afecta su stock)
INSERT INTO movimientos_inventario (oferta_id, tipo, cantidad, motivo) VALUES
  (1, 'entrada', 25, 'compra #1 (importacion)'),
  (6, 'entrada', 14, 'compra #1 (importacion)'),
  (3, 'entrada', 80, 'compra #2 (nacional)'),
  (5, 'entrada', 40, 'compra #2 (nacional)'),
  (1, 'salida',   1, 'venta BAGG-2026-0001'),
  (3, 'salida',   2, 'venta BAGG-2026-0001');

-- =====================================================================
-- 10. CONSULTAS DE VERIFICACION (ejemplos utiles)
-- =====================================================================

-- a) Catalogo con todas las ofertas y el ingreso que deja cada una a Bagg
-- SELECT p.codigo, p.nombre, o.tipo_venta,
--        COALESCE(pr.nombre,'Bagg (stock propio)') AS vendedor,
--        o.condicion, o.precio, o.stock,
--        CASE o.tipo_venta
--             WHEN 'propio'      THEN o.precio - o.precio_compra
--             ELSE o.precio * o.comision_pct / 100
--        END AS ingreso_bagg
-- FROM ofertas o
-- JOIN productos p         ON p.id = o.producto_id
-- LEFT JOIN proveedores pr ON pr.id = o.vendedor_id
-- ORDER BY p.codigo;

-- b) Varias ofertas para una misma pieza (ej. bujia ELE-003)
-- SELECT p.codigo, COALESCE(pr.nombre,'Bagg') AS vendedor, o.tipo_venta, o.condicion, o.precio
-- FROM ofertas o
-- JOIN productos p         ON p.id = o.producto_id
-- LEFT JOIN proveedores pr ON pr.id = o.vendedor_id
-- WHERE p.codigo = 'ELE-003';

-- c) Que piezas le sirven a un vehiculo (ej. Corolla)
-- SELECT mv.nombre AS modelo, p.nombre AS pieza, cp.anio_desde, cp.anio_hasta
-- FROM compatibilidades cp
-- JOIN modelos_vehiculo mv ON mv.id = cp.modelo_vehiculo_id
-- JOIN productos p         ON p.id = cp.producto_id
-- WHERE mv.nombre = 'Corolla';

-- d) Detalle de un pedido: lineas, vendedor, envio y gestion de importacion
-- SELECT pe.codigo, u.nombre AS cliente, dp.cantidad, p.nombre,
--        o.tipo_venta, dp.precio_unitario, dp.comision,
--        COALESCE(pr.nombre,'Bagg') AS vendedor,
--        en.tracking AS tracking_envio, g.estado_aduana
-- FROM pedidos pe
-- JOIN usuarios u          ON u.id = pe.usuario_id
-- JOIN detalle_pedido dp   ON dp.pedido_id = pe.id
-- JOIN ofertas o           ON o.id = dp.oferta_id
-- JOIN productos p         ON p.id = o.producto_id
-- LEFT JOIN proveedores pr ON pr.id = o.vendedor_id
-- LEFT JOIN envios en      ON en.pedido_id = pe.id
-- LEFT JOIN gestiones_importacion g ON g.pedido_id = pe.id
-- WHERE pe.codigo = 'BAGG-2026-0002';

-- e) Ingreso de Bagg separado por concepto: margen (1P) vs comision (3P)
-- SELECT o.tipo_venta,
--        SUM(CASE WHEN o.tipo_venta='propio'
--                 THEN (dp.precio_unitario - o.precio_compra) * dp.cantidad
--                 ELSE dp.comision END) AS ingreso_bagg
-- FROM detalle_pedido dp
-- JOIN ofertas o ON o.id = dp.oferta_id
-- GROUP BY o.tipo_venta;

-- f) Gestiones de importacion con sus documentos
-- SELECT g.id,
--        COALESCE(CONCAT('pedido ', g.pedido_id), CONCAT('compra ', g.compra_id)) AS origen,
--        g.pais_origen, g.estado_aduana, g.impuestos_aduana, g.costo_seguro,
--        di.tipo, di.numero
-- FROM gestiones_importacion g
-- LEFT JOIN documentos_importacion di ON di.gestion_id = g.id
-- ORDER BY g.id;
