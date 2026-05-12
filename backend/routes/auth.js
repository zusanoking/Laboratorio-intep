// routes/auth.js — Login y gestión de usuarios
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const authMW  = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const usuario = rows[0];
    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    res.json({ token, nombre: usuario.nombre, rol: usuario.rol });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/crear-usuario  (solo admin)
router.post('/crear-usuario', authMW, async (req, res) => {
  if (req.usuario.rol !== 'admin')
    return res.status(403).json({ error: 'Solo el administrador puede crear usuarios' });

  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });

  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, rol || 'encargado']
    );
    res.json({ ok: true, mensaje: 'Usuario creado correctamente' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'Ese email ya está registrado' });
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/me — verificar sesión activa
router.get('/me', authMW, (req, res) => {
  res.json({ ok: true, usuario: req.usuario });
});


module.exports = router;


