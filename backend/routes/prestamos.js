// routes/prestamos.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const authMW  = require('../middleware/auth');

// GET /api/prestamos — préstamos activos con sus detalles
router.get('/', authMW, async (req, res) => {
  try {
    const [prestamos] = await db.query(`
      SELECT p.*, 
        GROUP_CONCAT(
          JSON_OBJECT(
            'detalle_id', d.id,
            'articulo_id', d.articulo_id,
            'articulo_nombre', i.nombre,
            'categoria', i.categoria,
            'es_kit', i.es_kit,
            'cantidad', d.cantidad,
            'estado_salida', d.estado_salida,
            'completo_salida', d.completo_salida,
            'observaciones', d.observaciones,
            'devuelto', d.devuelto
          )
        ) AS detalles
      FROM prestamos p
      JOIN detalle_prestamo d ON d.prestamo_id = p.id
      JOIN inventario i ON d.articulo_id = i.id
      WHERE d.devuelto = 0
      GROUP BY p.id
      ORDER BY p.fecha_prestamo DESC
    `);

    const resultado = prestamos.map(p => ({
      ...p,
      detalles: JSON.parse('[' + p.detalles + ']')
    }));

    res.json(resultado);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/prestamos — registrar préstamo con múltiples artículos
router.post('/', authMW, async (req, res) => {
  const {
    nombre_solicitante, tipo_persona,
    identificacion, programa,
    articulos // array: [{articulo_id, cantidad, estado_salida, completo_salida, observaciones}]
  } = req.body;

  if (!nombre_solicitante || !tipo_persona || !articulos || articulos.length === 0)
    return res.status(400).json({ error: 'Faltan campos requeridos' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Crear el préstamo principal
    const [result] = await conn.query(
      `INSERT INTO prestamos 
        (nombre_solicitante, tipo_persona, identificacion, programa, 
        articulo_id, cantidad, estado_salida, completo_salida, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre_solicitante, tipo_persona, identificacion || null,
      programa || null,
      articulos[0].articulo_id, articulos[0].cantidad,
      articulos[0].estado_salida, articulos[0].completo_salida || 'N/A',
      req.usuario.id]
    );

    const prestamo_id = result.insertId;

    // Insertar cada artículo en detalle_prestamo
    for (const art of articulos) {
      const [inv] = await conn.query(
        'SELECT disponible FROM inventario WHERE id = ? AND activo = 1 FOR UPDATE',
        [art.articulo_id]
      );
      if (inv.length === 0) throw new Error('Artículo no encontrado: ' + art.articulo_id);
      if (inv[0].disponible < art.cantidad) throw new Error('Stock insuficiente para: ' + art.articulo_id);

      await conn.query(
        `INSERT INTO detalle_prestamo 
          (prestamo_id, articulo_id, cantidad, estado_salida, completo_salida, observaciones)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [prestamo_id, art.articulo_id, art.cantidad,
        art.estado_salida, art.completo_salida || 'N/A',
        art.observaciones || null]
      );

      await conn.query(
        'UPDATE inventario SET disponible = disponible - ? WHERE id = ?',
        [art.cantidad, art.articulo_id]
      );
    }

    await conn.commit();
    res.json({ ok: true, id: prestamo_id });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally {
    conn.release();
  }
});

module.exports = router;