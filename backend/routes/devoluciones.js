// routes/devoluciones.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const authMW  = require('../middleware/auth');

// GET /api/devoluciones
router.get('/', authMW, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        d.id, d.estado_retorno, d.completo_retorno,
        d.observaciones, d.fecha_devolucion,
        p.id AS prestamo_id,
        p.nombre_solicitante, p.tipo_persona, p.identificacion,
        p.programa, p.cantidad, p.estado_salida, p.completo_salida,
        p.observaciones AS obs_prestamo, p.fecha_prestamo,
        i.nombre AS articulo_nombre, i.categoria, i.es_kit
      FROM devoluciones d
      JOIN prestamos p  ON d.prestamo_id = p.id
      JOIN inventario i ON p.articulo_id = i.id
      ORDER BY d.fecha_devolucion DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/devoluciones/:prestamo_id
router.post('/:prestamo_id', authMW, async (req, res) => {
  const { estado_retorno, completo_retorno, observaciones } = req.body;
  const prestamo_id = parseInt(req.params.prestamo_id);

  if (!estado_retorno)
    return res.status(400).json({ error: 'El estado de retorno es requerido' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [prs] = await conn.query(
      'SELECT * FROM prestamos WHERE id = ? AND devuelto = 0',
      [prestamo_id]
    );
    if (prs.length === 0)
      throw new Error('Préstamo no encontrado o ya fue devuelto');

    const prestamo = prs[0];

    await conn.query(
      'INSERT INTO devoluciones (prestamo_id, estado_retorno, completo_retorno, observaciones, usuario_id) VALUES (?, ?, ?, ?, ?)',
      [prestamo_id, estado_retorno, completo_retorno || 'N/A', observaciones || null, req.usuario.id]
    );

    await conn.query(
      'UPDATE prestamos SET devuelto = 1 WHERE id = ?',
      [prestamo_id]
    );

    await conn.query(
      'UPDATE inventario SET disponible = disponible + ? WHERE id = ?',
      [prestamo.cantidad, prestamo.articulo_id]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally {
    conn.release();
  }
});

module.exports = router;