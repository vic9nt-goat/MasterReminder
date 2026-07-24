const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config.json');

// Importar el modelo desde tu carpeta models (ajusta el nombre del archivo si es diferente, ej. reminder.js)
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar motor de vistas y archivos estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Conectar a MongoDB Atlas
mongoose.connect(mongoUri)
  .then(() => console.log('🍃 Dashboard conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando dashboard a MongoDB:', err));

// Ruta principal del Dashboard
app.get('/', async (req, res) => {
  try {
    const totalRecordatorios = await Reminder.countDocuments({});
    const dbStatus = mongoose.connection.readyState === 1;

    res.render('dashboard', {
      totalRecordatorios,
      dbStatus,
      serversCount: 1 
    });
  } catch (error) {
    console.error('Error al obtener datos para el dashboard:', error);
    res.render('dashboard', {
      totalRecordatorios: 0,
      dbStatus: false,
      serversCount: 1
    });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Dashboard ejecutándose en http://localhost:${PORT}`);
});
