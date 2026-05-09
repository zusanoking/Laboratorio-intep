// routes/devoluciones.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const authMW  = require('../middleware/auth');

// GET /api/devoluciones
router.get('/', authMW, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, 
        p.nombre_solicitante, p.tipo_persona, p.identificacion,
        p.programa, p.fecha_prestamo,
        i.nombre AS articulo_nombre, i.categoria, i.es_kit
      FROM detalle_prestamo d
      JOIN prestamos p ON d.prestamo_id = p.id
      JOIN inventario i ON d.articulo_id = i.id
      WHERE d.devuelto = 1
      ORDER BY d.fecha_devolucion DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/devoluciones/:detalle_id
router.post('/:detalle_id', authMW, async (req, res) => {
  const { estado_retorno, completo_retorno, observaciones } = req.body;
  const detalle_id = parseInt(req.params.detalle_id);
  if (!estado_retorno)
    return res.status(400).json({ error: 'El estado de retorno es requerido' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [det] = await conn.query(
      'SELECT * FROM detalle_prestamo WHERE id = ? AND devuelto = 0',
      [detalle_id]
    );
    if (det.length === 0) throw new Error('Detalle no encontrado o ya devuelto');
    const detalle = det[0];
    await conn.query(
      `UPDATE detalle_prestamo SET 
        devuelto = 1, estado_retorno = ?, completo_retorno = ?,
        observaciones = CONCAT(IFNULL(observaciones,''), ' | Retorno: ', ?),
        fecha_devolucion = NOW()
      WHERE id = ?`,
      [estado_retorno, completo_retorno || 'N/A',
      observaciones || '', detalle_id]
    );
    await conn.query(
      'UPDATE inventario SET disponible = disponible + ? WHERE id = ?',
      [detalle.cantidad, detalle.articulo_id]
    );
    // Si todos los detalles del préstamo están devueltos, marcar préstamo como devuelto
    const [pendientes] = await conn.query(
      'SELECT COUNT(*) as total FROM detalle_prestamo WHERE prestamo_id = ? AND devuelto = 0',
      [detalle.prestamo_id]
    );
    if (pendientes[0].total === 0) {
      await conn.query('UPDATE prestamos SET devuelto = 1 WHERE id = ?', [detalle.prestamo_id]);
    }
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