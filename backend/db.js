const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');
require('dotenv').config();

const pool = mysql.createPool({
host:     process.env.DB_HOST,
port:     process.env.DB_PORT,
user:     process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
waitForConnections: true,
connectionLimit: 10,
multipleStatements: true,
});

async function inicializarDB() {
try {
    const conn = await pool.getConnection();
    console.log('✅ Conectado a MySQL — base de datos: ' + process.env.DB_NAME);

    await conn.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id        INT AUTO_INCREMENT PRIMARY KEY,
        nombre    VARCHAR(100) NOT NULL,
        email     VARCHAR(100) NOT NULL UNIQUE,
        password  VARCHAR(255) NOT NULL,
        rol       ENUM('admin','encargado') DEFAULT 'encargado',
        activo    TINYINT(1) DEFAULT 1,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await conn.query(`
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
    `);

    await conn.query(`
    CREATE TABLE IF NOT EXISTS prestamos (
        id                 INT AUTO_INCREMENT PRIMARY KEY,
        articulo_id        INT NOT NULL,
        nombre_solicitante VARCHAR(150) NOT NULL,
        tipo_persona       ENUM('Estudiante','Docente') NOT NULL,
        identificacion     VARCHAR(30) DEFAULT NULL,
        programa           VARCHAR(100) DEFAULT NULL,
        cantidad           INT NOT NULL DEFAULT 1,
        estado_salida      ENUM('Bueno','Regular','Malo') NOT NULL,
        completo_salida    ENUM('Completo','Incompleto','N/A') DEFAULT 'N/A',
        observaciones      TEXT DEFAULT NULL,
        devuelto           TINYINT(1) DEFAULT 0,
        fecha_prestamo     DATETIME DEFAULT CURRENT_TIMESTAMP,
        usuario_id         INT NOT NULL,
        FOREIGN KEY (articulo_id) REFERENCES inventario(id),
        FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
    );
    `);

    await conn.query(`
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
    `);

    console.log('✅ Tablas verificadas correctamente');
    conn.release();
} catch (e) {
    console.error('❌ Error al conectar a MySQL:', e.message);
    process.exit(1);
}
}

inicializarDB();
module.exports = pool;






