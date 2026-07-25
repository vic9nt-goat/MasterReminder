const { Events } = require('discord.js');
const db = require('../database');

module.exports = {
  name: Events.ClientReady,
  once: true,
  
  async execute(client) {
    // Función para actualizar los contadores de todos los servidores registrados
    const updateAllGuilds = async () => {
      for (const guild of client.guilds.cache.values()) {
        try {
          const config = await db.getStatsConfig(guild.id);
          if (!config || !config.memberChannelId) continue;

          // Asegurarnos de tener todos los miembros cacheados para contar bien
          await guild.members.fetch();

          const totalMembers = guild.memberCount;
          const totalBots = guild.members.cache.filter(m => m.user.bot).size;
          const totalHumans = totalMembers - totalBots;

          // Actualizar canal de total de miembros
          const memberChannel = guild.channels.cache.get(config.memberChannelId);
          if (memberChannel) {
            await memberChannel.setName(`👥 Miembros: ${totalMembers}`).catch(() => {});
          }

          // Actualizar canal de humanos
          const humanChannel = guild.channels.cache.get(config.humanChannelId);
          if (humanChannel) {
            await humanChannel.setName(`👤 Humanos: ${totalHumans}`).catch(() => {});
          }

          // Actualizar canal de bots
          const botChannel = guild.channels.cache.get(config.botChannelId);
          if (botChannel) {
            await botChannel.setName(`🤖 Bots: ${totalBots}`).catch(() => {});
          }
        } catch (err) {
          console.error(`Error actualizando stats para el servidor ${guild.name}:`, err);
        }
      }
    };

    // Ejecutar la primera actualización al arrancar el bot (dando un pequeño margen de 5 segundos)
    setTimeout(updateAllGuilds, 5000);

    // Actualizar automáticamente cada 30 minutos por seguridad
    setInterval(updateAllGuilds, 30 * 60 * 1000);

    // Escuchar cuando alguien entra o sale para actualizar en tiempo real
    client.on(Events.GuildMemberAdd, () => updateAllGuilds());
    client.on(Events.GuildMemberRemove, () => updateAllGuilds());
  }
};
