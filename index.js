const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const fs = require('fs');
const Reminder = require('./models/Reminder');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

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

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
const discordToken = process.env.DISCORD_TOKEN || process.env.TOKEN;

mongoose.connect(mongoUri)
  .then(() => {
    console.log('🍃 Conectado exitosamente a MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🌐 Dashboard ejecutándose en http://localhost:${PORT}`);
    });
    client.login(discordToken);
  })
  .catch(err => {
    console.error('❌ Error al iniciar el bot o conectar a MongoDB:', err);
  });

client.once('ready', () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
});
