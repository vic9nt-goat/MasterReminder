const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lista-recordatorios')
    .setDescription('Muestra todos tus recordatorios pendientes'),

  async execute(interaction) {
    const reminders = await db.getUserReminders(interaction.user.id);

    if (!reminders || reminders.length === 0) {
      return interaction.reply({
        content: '📭 No tienes recordatorios activos.',
        ephemeral: true
      });
    }

    const list = reminders.map((r) => {
      const dateStr = `<t:${Math.floor(r.remindAt / 1000)}:R>`;
      return `• **ID:** \`${r._id}\` | **Mensaje:** ${r.message} | **Para:** ${dateStr}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle('📋 Tus Recordatorios Pendientes')
      .setDescription(list);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};