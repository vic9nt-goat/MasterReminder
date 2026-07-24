const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Soporte para variables de entorno de Render o archivo config.json local
let token, mongoUri;
try {
  const config = require('./config.json');
  token = process.env.DISCORD_TOKEN || config.token;
  mongoUri = process.env.MONGO_URI || config.mongoUri;
} catch {
  token = process.env.DISCORD_TOKEN;
  mongoUri = process.env.MONGO_URI;
}

// Inicializar el cliente del bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// 1. Cargar Comandos (Soporta subcarpetas y verifica que sea un directorio)
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const stat = fs.statSync(commandsPath);

    if (stat.isDirectory()) {
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
        } else {
          console.warn(`[ADVERTENCIA] Al comando en ${filePath} le falta la propiedad "data" o "execute".`);
        }
      }
    }
  }
} else {
  console.error('[ERROR] La carpeta "commands" no existe.');
}

// 2. Cargar Eventos
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
} else {
  console.error('[ERROR] La carpeta "events" no existe.');
}

// 3. Conexión a MongoDB e inicio de sesión en Discord
(async () => {
  try {
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log('🍃 Conexión exitosa a MongoDB Atlas');
    } else {
      console.warn('⚠️ No se proporcionó "mongoUri" en las variables de entorno ni en config.json');
    }

    await client.login(token);
  } catch (error) {
    console.error('❌ Error al iniciar el bot o conectar a MongoDB:', error);
  }
})();