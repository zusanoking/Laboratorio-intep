// middleware/auth.js — Verifica que el usuario esté logueado
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
const header = req.headers['authorization'];
if (!header) return res.status(401).json({ error: 'No autorizado — falta token' });

  const token = header.split(' ')[1]; // Bearer <token>
if (!token) return res.status(401).json({ error: 'No autorizado — token inválido' });

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id, nombre, email, rol }
    next();
} catch (e) {
    return res.status(401).json({ error: 'Token expirado o inválido — inicia sesión de nuevo' });
}
};







