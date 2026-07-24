const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config.json');
const Reminder = require('./Reminder');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

mongoose.connect(config.mongoUri)
  .then(() => console.log('🍃 Dashboard conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando dashboard a MongoDB:', err));

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

app.listen(PORT, () => {
  console.log(`🌐 Dashboard ejecutándose en http://localhost:${PORT}`);
});
