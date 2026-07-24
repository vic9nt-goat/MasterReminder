const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const config = require('./config.json'); // Ajusta la ruta si config.json está en otro lado
const Reminder = require('./models/Reminder');

// 1. Configurar Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 2. Configurar Express (Dashboard)
const app = express();
const PORT = process.env.PORT || 10000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  try {
    const totalRecordatorios = await Reminder.countDocuments({});
    const dbStatus = mongoose.connection.readyState === 1;

    res.render('dashboard', {
      totalRecordatorios,
      dbStatus,
      serversCount: client.guilds.cache.size 
    });
  } catch (error) {
    console.error('Error al obtener datos para el dashboard:', error);
    res.render('dashboard', {
      totalRecordatorios: 0,
      dbStatus: false,
      serversCount: client.guilds.cache.size
    });
  }
});

// 3. Conexión a MongoDB e inicio general
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('🍃 Conectado exitosamente a MongoDB Atlas');
    
    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log(`🌐 Dashboard ejecutándose en http://localhost:${PORT}`);
    });

    // Iniciar Bot de Discord
    client.login(config.token);
  })
  .catch(err => {
    console.error('❌ Error al iniciar el bot o conectar a MongoDB:', err);
  });

client.once('ready', () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
});
