const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');

module.exports = function startScheduler(client) {
  setInterval(async () => {
    try {
      const dueReminders = await db.getDueReminders();

      for (const reminder of dueReminders) {
        try {
          const channel = await client.channels.fetch(reminder.channelId).catch(() => null);

          if (channel) {
            let mentionText = `<@${reminder.userId}>`;
            if (reminder.targetRoleId) {
              mentionText = `<@&${reminder.targetRoleId}>`;
            }

            const embed = new EmbedBuilder()
              .setColor('#5865F2')
              .setTitle('⏰ ¡RECORDATORIO DE REMINDMASTER!')
              .setDescription(reminder.message)
              .addFields(
                { name: '👤 Creado por', value: `<@${reminder.userId}>`, inline: true }
              )
              .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`snooze_${reminder.userId}_${encodeURIComponent(reminder.message)}`)
                .setLabel('+10 Minutos')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⏰')
            );

            await channel.send({ content: mentionText, embeds: [embed], components: [row] });
          }
        } catch (error) {
          console.error(`Error procesando recordatorio ${reminder._id}:`, error);
        } finally {
          await db.deleteReminder(reminder._id);
        }
      }
    } catch (err) {
      console.error('Error en el scheduler:', err);
    }
  }, 5000);
};