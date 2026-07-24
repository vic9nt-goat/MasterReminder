const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rol-notificacion')
    .setDescription('Configura un rol por defecto para ser mencionado en las alertas')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(opt =>
      opt.setName('rol')
        .setDescription('El rol a mencionar')
        .setRequired(true)),

  async execute(interaction) {
    const role = interaction.options.getRole('rol');
    await db.setGuildRole(interaction.guild.id, role.id);

    await interaction.reply({
      content: `✅ El rol por defecto para las notificaciones ha sido configurado a ${role}.`,
      ephemeral: true
    });
  }
};