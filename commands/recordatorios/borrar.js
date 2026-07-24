const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('borrar-recordatorio')
    .setDescription('Elimina un recordatorio pendiente por su ID')
    .addStringOption(opt =>
      opt.setName('id')
        .setDescription('El ID del recordatorio')
        .setRequired(true)),

  async execute(interaction) {
    const id = interaction.options.getString('id');
    const userReminders = await db.getUserReminders(interaction.user.id);

    const exists = userReminders.find(r => r._id.toString() === id);

    if (!exists) {
      return interaction.reply({
        content: `❌ No se encontró ningún recordatorio activo con el ID **${id}** que te pertenezca.`,
        ephemeral: true
      });
    }

    await db.deleteReminder(id);

    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('🗑️ Recordatorio Eliminado')
      .setDescription(`El recordatorio **"${exists.message}"** ha sido eliminado.`);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};