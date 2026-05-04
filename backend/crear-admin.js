// crear-admin.js
// Ejecuta este script UNA SOLA VEZ para crear el usuario administrador
// Comando: node crear-admin.js

const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');
require('dotenv').config();

async function crearAdmin() {
const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const email    = 'admin@intep.edu.co';
  const password = 'intep2025';           // ← cambia esto
const nombre   = 'Administrador INTEP';

const hash = await bcrypt.hash(password, 10);

  // Borrar si existe y crear de nuevo
await conn.query('DELETE FROM usuarios WHERE email = ?', [email]);
await conn.query(
    'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, hash, 'admin']
);

console.log('✅ Usuario administrador creado correctamente');
console.log('   Email:    ' + email);
console.log('   Password: ' + password);
console.log('   Cambia la contraseña después de iniciar sesión.');
await conn.end();
}

crearAdmin().catch(e => {
console.error('❌ Error:', e.message);
process.exit(1);
});






