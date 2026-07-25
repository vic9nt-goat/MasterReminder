// ==========================================
// ARCHIVO: commands/bienvenida/bienvenida-test.js
// ==========================================
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bienvenida-test')
    .setDescription('Simula una tarjeta de bienvenida usando la configuración actual de la base de datos')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const guildId = interaction.guild.id;
      const member = interaction.member;

      const config = await db.getWelcomeConfig(guildId);

      if (!config || (config.enabled !== true && config.enabled !== 'true' && config.enabled !== 1)) {
        return await interaction.editReply({ 
          content: '⚠️ El sistema de bienvenidas está **desactivado** o no tiene una configuración guardada. Actívalo primero con `/bienvenida-config estado:True`.' 
        });
      }

      const targetChannel = interaction.guild.channels.cache.get(config.channelId) || interaction.channel;

      const customMsg = config.message || '¡Bienvenido {usuario} a {servidor}! Eres nuestro miembro número #{contador}.';
      const formattedMsg = customMsg
        .replace(/{usuario}/g, `${member}`)
        .replace(/{servidor}/g, member.guild.name)
        .replace(/{contador}/g, member.guild.memberCount);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🧪 [PRUEBA] • ¡Nuevo Miembro en el Servidor!')
        .setDescription(formattedMsg)
        .addFields(
          { name: '👤 Usuario', value: `\`${member.user.tag}\``, inline: true },
          { name: '📊 Censo Actual', value: `Miembro #\`${member.guild.memberCount}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `${member.guild.name} • Sistema de Bienvenidas (Test)`, iconURL: member.guild.iconURL({ dynamic: true }) });

      if (config.imageUrl) {
        embed.setImage(config.imageUrl);
      }

      await targetChannel.send({
        content: `${member}`,
        embeds: [embed]
      });

      await interaction.editReply({ 
        content: `✅ ¡Simulación de bienvenida enviada con éxito a ${targetChannel} usando los datos de la base de datos!` 
      });

    } catch (error) {
      console.error('Error en /bienvenida-test:', error);
      await interaction.editReply({ 
        content: '❌ Ocurrió un error al ejecutar la simulación de bienvenida.' 
      });
    }
  }
};
