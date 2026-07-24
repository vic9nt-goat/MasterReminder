const { REST, Routes, Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const token = process.env.TOKEN || process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const mongoUri = process.env.MONGO_URI;
const PORT = process.env.PORT || 10000;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Dashboard ejecutándose correctamente');
});

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

client.commands = new Map();

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      client.commands.set(command.data.name, command);
    }
  }
}

client.once('clientReady', async () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);

  try {
    const rest = new REST({ version: '10' }).setToken(token);
    console.log(`⏳ Registrando ${commands.length} comandos Slash...`);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('✅ ¡Comandos registrados exitosamente!');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorMessage = { content: 'Hubo un error al ejecutar este comando.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

mongoose.connect(mongoUri)
  .then(() => {
    console.log('🍃 Conectado exitosamente a MongoDB Atlas');
    
    app.listen(PORT, () => {
      console.log(`🌐 Dashboard ejecutándose en http://localhost:${PORT}`);
    });

    client.login(token);
  })
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
  });
