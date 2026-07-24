const { Events } = require('discord.js');
const db = require('../database');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error ejecutando ${interaction.commandName}:`, error);
        await interaction.reply({ content: '❌ Ocurrió un error al ejecutar este comando.', ephemeral: true });
      }
    } 
    else if (interaction.isButton()) {
      if (interaction.customId.startsWith('snooze_')) {
        const [, userId, encodedMessage] = interaction.customId.split('_');
        const message = decodeURIComponent(encodedMessage);

        if (interaction.user.id !== userId) {
          return interaction.reply({ content: '❌ Solo quien recibió esta alerta puede posponerla.', ephemeral: true });
        }

        const newRemindAt = Date.now() + 10 * 60 * 1000;
        await db.addReminder(
          userId,
          interaction.channel.id,
          interaction.guild ? interaction.guild.id : null,
          message,
          newRemindAt
        );

        await interaction.reply({ content: '⏰ ¡Recordatorio pospuesto por 10 minutos más!', ephemeral: true });
      }
    }
  }
};