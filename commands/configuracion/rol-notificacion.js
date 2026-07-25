const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rol-notificacion')
    .setDescription('Configura, visualiza o elimina el rol por defecto para las notificaciones y recordatorios')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('establecer')
        .setDescription('Establece un rol por defecto para ser mencionado en las alertas')
        .addRoleOption(opt =>
          opt.setName('rol')
            .setDescription('El rol a mencionar')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Muestra el rol de notificación configurado actualmente en el servidor'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remover')
        .setDescription('Elimina el rol de notificación configurado')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    try {
      if (subcommand === 'establecer') {
        const role = interaction.options.getRole('rol');

        await db.setGuildRole(guildId, role.id);

        const embed = new EmbedBuilder()
          .setTitle('⚙️ Rol de Notificación Actualizado')
          .setDescription(`El rol por defecto para las notificaciones ha sido configurado exitosamente a ${role}.`)
          .addFields(
            { name: 'Rol Asignado', value: `${role.name} (\`${role.id}\`)`, inline: true },
            { name: 'Configurado por', value: `${interaction.user}`, inline: true }
          )
          .setColor('#57F287')
          .setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      } 
      
      else if (subcommand === 'ver') {
        const roleId = await db.getGuildRole(guildId);

        if (!roleId) {
          return await interaction.reply({
            content: '⚠️ Este servidor no tiene ningún rol de notificación configurado actualmente. Usa `/rol-notificacion establecer` para configurarlo.',
            ephemeral: true
          });
        }

        const role = interaction.guild.roles.cache.get(roleId);
        const roleDisplay = role ? `${role}` : `Rol no encontrado (ID: \`${roleId}\`)`;

        const embed = new EmbedBuilder()
          .setTitle('📋 Configuración de Notificaciones')
          .setDescription(`El rol actual configurado para recibir menciones y alertas en este servidor es:`)
          .addFields(
            { name: 'Rol Actual', value: roleDisplay, inline: false }
          )
          .setColor('#5865F2')
          .setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      } 
      
      else if (subcommand === 'remover') {
        const currentRole = await db.getGuildRole(guildId);

        if (!currentRole) {
          return await interaction.reply({
            content: '⚠️ No hay ningún rol de notificación configurado para eliminar.',
            ephemeral: true
          });
        }

        await db.setGuildRole(guildId, null);

        const embed = new EmbedBuilder()
          .setTitle('🗑️ Rol de Notificación Eliminado')
          .setDescription('Se ha removido correctamente el rol por defecto para las notificaciones de este servidor.')
          .setColor('#ED4245')
          .setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (error) {
      console.error('Error al gestionar el rol de notificación:', error);
      await interaction.reply({
        content: '❌ Ocurrió un error inesperado al procesar esta configuración en la base de datos.',
        ephemeral: true
      });
    }
  }
};
