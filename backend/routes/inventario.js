// routes/inventario.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const authMW  = require('../middleware/auth');

// GET /api/inventario — listar todo
router.get('/', authMW, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM inventario WHERE activo = 1 ORDER BY categoria, nombre'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/inventario/disponibles — solo artículos con stock
router.get('/disponibles', authMW, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM inventario WHERE activo = 1 AND disponible > 0 ORDER BY nombre'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/inventario — agregar artículo
router.post('/', authMW, async (req, res) => {
  const { nombre, categoria, cantidad, serie, descripcion, es_kit } = req.body;
  if (!nombre || !categoria)
    return res.status(400).json({ error: 'Nombre y categoría son requeridos' });

  try {
    const cant = parseInt(cantidad) || 1;
    const [result] = await db.query(
      'INSERT INTO inventario (nombre, categoria, cantidad, disponible, serie, descripcion, es_kit) VALUES (?,?,?,?,?,?,?)',
      [nombre, categoria, cant, cant, serie || null, descripcion || null, es_kit ? 1 : 0]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/inventario/:id — editar artículo
router.put('/:id', authMW, async (req, res) => {
  const { nombre, categoria, serie, descripcion } = req.body;
  try {
    await db.query(
      'UPDATE inventario SET nombre=?, categoria=?, serie=?, descripcion=? WHERE id=?',
      [nombre, categoria, serie || null, descripcion || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/inventario/:id — desactivar (no borrar físicamente)
router.delete('/:id', authMW, async (req, res) => {
  const { nombre, categoria, serie, descripcion } = req.body;
  if (!nombre || !categoria) return res.status(400).json({ error: 'Faltan campos' });
  try {
    await db.query(
      'UPDATE inventario SET nombre=?, categoria=?, serie=?, descripcion=?, es_kit=? WHERE id=?',
      [nombre, categoria, serie || null, descripcion || null, categoria === 'Kit' ? 1 : 0, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;




