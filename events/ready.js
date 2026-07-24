const { Events, ActivityType } = require('discord.js');
const startScheduler = require('../utils/scheduler');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`🤖 Bot iniciado como ${client.user.tag}`);

    // Función para actualizar la presencia con el número actual de servidores
    const updatePresence = () => {
      const serverCount = client.guilds.cache.size;
      client.user.setPresence({
        activities: [
          {
            name: `En ${serverCount} servidor${serverCount === 1 ? '' : 'es'}`,
            type: ActivityType.Watching // Muestra "Viendo En X servidores"
          }
        ],
        status: 'online'
      });
    };

    // Establecer presencia inicial
    updatePresence();

    // Guardar la función en client por si queremos invocarla en otros eventos
    client.updatePresence = updatePresence;

    // Iniciar el programador de recordatorios
    startScheduler(client);
  }
};