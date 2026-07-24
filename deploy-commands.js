const { REST, Routes } = require('discord.js');
const { token, clientId } = require('./config.json');
const fs = require('fs');
const path = require('path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`⏳ Registrando ${commands.length} comandos Slash...`);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('✅ ¡Comandos registrados exitosamente!');
  } catch (error) {
    console.error(error);
  }
})();