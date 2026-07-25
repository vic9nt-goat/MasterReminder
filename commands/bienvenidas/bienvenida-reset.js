// ==========================================
// ARCHIVO: commands/bienvenida/bienvenida-reset.js
// ==========================================
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bienvenida-reset')
    .setDescription('Borra y restaura por completo todos los ajustes de bienvenida del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await db.resetWelcomeConfig(interaction.guild.id);

      const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('🗑️ Configuración Reseteada')
        .setDescription('Se han borrado todos los parámetros, canales, roles e imágenes del sistema de bienvenidas en este servidor.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en /bienvenida-reset:', error);
      await interaction.editReply({ content: '❌ Ocurrió un error al restablecer la configuración.' });
    }
  }
};
