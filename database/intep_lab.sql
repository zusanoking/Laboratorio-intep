-- ============================================================
--  BASE DE DATOS: Sistema de Préstamos - Laboratorio INTEP
--  Roldanillo, Valle del Cauca
-- ============================================================

CREATE DATABASE IF NOT EXISTS intep_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE intep_lab;

-- ============================================================
--  USUARIOS (solo el encargado del lab puede entrar)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
id          INT AUTO_INCREMENT PRIMARY KEY,
nombre      VARCHAR(100) NOT NULL,
email       VARCHAR(100) NOT NULL UNIQUE,
password    VARCHAR(255) NOT NULL,  -- se guarda encriptado con bcrypt
rol         ENUM('admin','encargado') DEFAULT 'encargado',
activo      TINYINT(1) DEFAULT 1,
creado_en   DATETIME DEFAULT CURRENT_TIMESTAMPñ
);

-- ============================================================
--  INVENTARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS inventario (
id          INT AUTO_INCREMENT PRIMARY KEY,
nombre      VARCHAR(150) NOT NULL,
categoria   ENUM('Redes','Kit','Herramienta','Computador','Otro') NOT NULL,
cantidad    INT NOT NULL DEFAULT 1,
disponible  INT NOT NULL DEFAULT 1,
serie       VARCHAR(100) DEFAULT NULL,
descripcion TEXT DEFAULT NULL,
es_kit      TINYINT(1) DEFAULT 0,
activo      TINYINT(1) DEFAULT 1,
creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  PRÉSTAMOS
-- ============================================================
CREATE TABLE IF NOT EXISTS prestamos (
id               INT AUTO_INCREMENT PRIMARY KEY,
articulo_id      INT NOT NULL,
nombre_solicitante VARCHAR(150) NOT NULL,
tipo_persona     ENUM('Estudiante','Docente') NOT NULL,
identificacion   VARCHAR(30) DEFAULT NULL,
programa         VARCHAR(100) DEFAULT NULL,

cantidad         INT NOT NULL DEFAULT 1,
estado_salida    ENUM('Bueno','Regular','Malo') NOT NULL,
completo_salida  ENUM('Completo','Incompleto','N/A') DEFAULT 'N/A',
observaciones    TEXT DEFAULT NULL,
devuelto         TINYINT(1) DEFAULT 0,
fecha_prestamo   DATETIME DEFAULT CURRENT_TIMESTAMP,
usuario_id       INT NOT NULL,
FOREIGN KEY (articulo_id) REFERENCES inventario(id),
FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
);

-- ============================================================
--  DEVOLUCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS devoluciones (
id               INT AUTO_INCREMENT PRIMARY KEY,
prestamo_id      INT NOT NULL UNIQUE,
estado_retorno   ENUM('Bueno','Regular','Malo') NOT NULL,
completo_retorno ENUM('Completo','Incompleto','N/A') DEFAULT 'N/A',
observaciones    TEXT DEFAULT NULL,
fecha_devolucion DATETIME DEFAULT CURRENT_TIMESTAMP,
usuario_id       INT NOT NULL,
FOREIGN KEY (prestamo_id) REFERENCES prestamos(id),
FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
);

-- ============================================================
--  DATOS INICIALES
-- ============================================================

-- Usuario administrador por defecto
-- Email: admin@intep.edu.co  |  Password: intep2025
-- (el hash fue generado con bcrypt, cámbialo luego desde la app)
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Administrador INTEP', 'admin@intep.edu.co',
'$2b$10$YourHashHereReplace', 'admin');

-- Inventario inicial del laboratorio
INSERT INTO inventario (nombre, categoria, cantidad, disponible, serie, descripcion, es_kit) VALUES
('Router Cisco 2901',          'Redes',       3, 3, 'CSC-2901', 'Router de borde para configuración de redes WAN', 0),
('Switch Cisco Catalyst 2960', 'Redes',       4, 4, 'SW-2960',  'Switch administrable 24 puertos Fast Ethernet',   0),
('Kit Arduino Uno',            'Kit',         5, 5, NULL, 'Arduino Uno, protoboard, resistencias, LEDs, cables jumper, sensor DHT11', 1),
('Kit de Soldadura',           'Kit',         2, 2, NULL, 'Soldador 40W, estaño, flux, soporte soldador, malla desoldadora', 1),
('Cable de Red Cat6 (2m)',     'Redes',      10,10, NULL, 'Cable UTP Cat6 de 2 metros con conectores RJ-45', 0),
('Multímetro Digital',         'Herramienta', 3, 3, 'MT-001', 'Multímetro para medición de voltaje, corriente y resistencia', 0),
('Kit Raspberry Pi 4',         'Kit',         2, 2, NULL, 'Raspberry Pi 4 4GB, cargador, tarjeta SD 32GB, case, cable HDMI', 1);








