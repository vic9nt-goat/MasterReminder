const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

// Soporte para variables de entorno de Render o archivo config.json local
let mongoUri;
try {
  mongoUri = process.env.MONGO_URI || require('./config.json').mongoUri;
} catch {
  mongoUri = process.env.MONGO_URI;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar motor de vistas y archivos estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Modelo de Mongoose para consultar los recordatorios
let Reminder;
try {
  Reminder = mongoose.model('Reminder');
} catch {
  const reminderSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    mensaje: String,
    fechaRecordatorio: Date
  });
  Reminder = mongoose.model('Reminder', reminderSchema);
}

// Conectar a MongoDB Atlas para el servidor web
mongoose.connect(mongoUri)
  .then(() => console.log('🍃 Dashboard conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando dashboard a MongoDB:', err));

// Ruta principal del Dashboard con datos reales
app.get('/', async (req, res) => {
  try {
    // Contar recordatorios activos en la base de datos
    const totalRecordatorios = await Reminder.countDocuments();
    
    // Estado de la conexión de Mongoose (1 = conectado)
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

// Importar el bot de Discord para que corra simultáneamente en el mismo proceso
require('./index.js');

app.listen(PORT, () => {
  console.log(`🌐 Dashboard completo ejecutándose en el puerto ${PORT}`);
});