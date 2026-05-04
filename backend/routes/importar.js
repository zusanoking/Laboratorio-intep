// routes/importar.js
const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const { parse } = require('csv-parse/sync');
const db      = require('../db');
const authMW  = require('../middleware/auth');

const URL_INVENTARIO = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSorT31ute3jFZVLcz24l9HOmZlKc3dluldhi5HjWRsFjmK4PgGWNXgUGTEEpul5PC2MJ-SmZe2ezdD/pub?gid=0&single=true&output=csv';
const URL_KITS       = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSorT31ute3jFZVLcz24l9HOmZlKc3dluldhi5HjWRsFjmK4PgGWNXgUGTEEpul5PC2MJ-SmZe2ezdD/pub?gid=399823390&single=true&output=csv';

// POST /api/importar — importar desde Google Sheets
router.post('/', authMW, async (req, res) => {
const conn = await db.getConnection();
try {
    await conn.beginTransaction();

    let importados = 0;
    let omitidos   = 0;

    // ---- 1. Leer INVENTARIO GENERAL ----
    const respInv = await axios.get(URL_INVENTARIO);
    const filasInv = parse(respInv.data, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    });

    for (const fila of filasInv) {
      // Columnas: ID, Componente, Cantidad, Disponibles, Estado, Columna1...
    const nombre    = fila['Componente'] || fila['COMPONENTE'] || '';
    const cantidad  = parseInt(fila['Cantidad'] || fila['CANTIDAD']) || 1;
    const disponible = parseInt(fila['Disponibles'] || fila['DISPONIBLES'] || fila['Disponible']) || cantidad;
    const serie     = fila['ID'] || fila['id'] || null;

    if (!nombre) { omitidos++; continue; }

      // Detectar si es kit por el nombre
    const esKit = nombre.toLowerCase().includes('kit');

      // Detectar categoría
    let categoria = 'Herramienta';
    const n = nombre.toLowerCase();
    if (esKit) categoria = 'Kit';
    else if (n.includes('router') || n.includes('switch') || n.includes('cable') ||
            n.includes('red') || n.includes('fibra') || n.includes('rj') ||
            n.includes('convertidor') || n.includes('sfp')) categoria = 'Redes';
    else if (n.includes('computador') || n.includes('laptop') || n.includes('pc')) categoria = 'Computador';

      // Verificar si ya existe
    const [existe] = await conn.query(
        'SELECT id FROM inventario WHERE nombre = ? AND activo = 1',
        [nombre]
    );

    if (existe.length > 0) {
        // Actualizar cantidades
        await conn.query(
        'UPDATE inventario SET cantidad = ?, disponible = ? WHERE nombre = ? AND activo = 1',
        [cantidad, disponible, nombre]
        );
        omitidos++;
    } else {
        // Insertar nuevo
        await conn.query(
        'INSERT INTO inventario (nombre, categoria, cantidad, disponible, serie, es_kit) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, categoria, cantidad, disponible, serie, esKit ? 1 : 0]
        );
        importados++;
    }
    }

    // ---- 2. Leer KITS LAB 4.0 ----
    const respKits = await axios.get(URL_KITS);
    const filasKits = parse(respKits.data, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    });

    for (const fila of filasKits) {
    const nombre    = fila['NOMBRE DEL KIT'] || fila['Nombre del Kit'] || fila['nombre del kit'] || '';
    const cantidad  = parseInt(fila['DISPONIBILIDAD'] || fila['Disponibilidad']) || 1;
    const serie     = fila['ID KIT'] || fila['id kit'] || null;

    if (!nombre) { omitidos++; continue; }

    const [existe] = await conn.query(
        'SELECT id FROM inventario WHERE nombre = ? AND activo = 1',
        [nombre]
    );

    if (existe.length > 0) {
        await conn.query(
        'UPDATE inventario SET cantidad = ?, disponible = ? WHERE nombre = ? AND activo = 1',
        [cantidad, cantidad, nombre]
        );
        omitidos++;
    } else {
        await conn.query(
        'INSERT INTO inventario (nombre, categoria, cantidad, disponible, serie, es_kit) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, 'Kit', cantidad, cantidad, serie, 1]
        );
        importados++;
    }
    }

    await conn.commit();
    res.json({
    ok: true,
    mensaje: `Importación completada: ${importados} artículos nuevos, ${omitidos} actualizados.`
    });

} catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'Error al importar: ' + e.message });
} finally {
    conn.release();
}
});

module.exports = router;





