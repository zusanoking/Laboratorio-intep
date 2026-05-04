// routes/prestamos.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const authMW  = require('../middleware/auth');

// GET /api/prestamos — todos los préstamos activos
router.get('/', authMW, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, i.nombre AS articulo_nombre, i.categoria, i.es_kit
      FROM prestamos p
      JOIN inventario i ON p.articulo_id = i.id
      WHERE p.devuelto = 0
      ORDER BY p.fecha_prestamo DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/prestamos — registrar préstamo
router.post('/', authMW, async (req, res) => {
  const {
    articulo_id, nombre_solicitante, tipo_persona,
    identificacion, programa, cantidad,
    estado_salida, completo_salida, observaciones
  } = req.body;

  if (!articulo_id || !nombre_solicitante || !tipo_persona || !estado_salida)
    return res.status(400).json({ error: 'Faltan campos requeridos' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar disponibilidad
    const [art] = await conn.query(
      'SELECT disponible FROM inventario WHERE id = ? AND activo = 1 FOR UPDATE',
      [articulo_id]
    );
    if (art.length === 0)
      throw new Error('Artículo no encontrado');

    const cant = parseInt(cantidad) || 1;
    if (art[0].disponible < cant)
      throw new Error('No hay suficientes unidades disponibles');

    // Crear préstamo
    const [result] = await conn.query(
      `INSERT INTO prestamos
        (articulo_id, nombre_solicitante, tipo_persona, identificacion,
         programa, cantidad, estado_salida, completo_salida, observaciones, usuario_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [articulo_id, nombre_solicitante, tipo_persona, identificacion || null,
       programa || null, cant, estado_salida,
       completo_salida || 'N/A', observaciones || null, req.usuario.id]
    );

    // Descontar del inventario
    await conn.query(
      'UPDATE inventario SET disponible = disponible - ? WHERE id = ?',
      [cant, articulo_id]
    );

    await conn.commit();
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally {
    conn.release();
  }
});

module.exports = router;