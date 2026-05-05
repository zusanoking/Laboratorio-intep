const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, 'frontend');
console.log('Ruta frontend:', frontendPath);

app.use(express.static(frontendPath));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/inventario',   require('./routes/inventario'));
app.use('/api/prestamos',    require('./routes/prestamos'));
app.use('/api/devoluciones', require('./routes/devoluciones'));
app.use('/api/importar',     require('./routes/importar'));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en laboratorio-intep-production.up.railway.app:${PORT}`); // http://localhost:${PORT}`); esto es lo que estaba antes 
  console.log(`📋 Laboratorio INTEP — Roldanillo, Valle del Cauca`);
});


