// ==========================================
// ARCHIVO: commands/bienvenida/bienvenida-test.js
// ==========================================
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bienvenida-test')
    .setDescription('Simula EXACTAMENTE lo que configuraste en el comando de bienvenida')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const guildId = interaction.guild.id;
      const member = interaction.member;

      const config = await GuildConfig.findOne({ guildId });

      if (!config || !config.channelId) {
        return await interaction.editReply({ 
          content: '⚠️ No hay ninguna configuración guardada. Configura primero con `/bienvenida-config`.' 
        });
      }

      const targetChannel = interaction.guild.channels.cache.get(config.channelId) || interaction.channel;

      const customMsg = config.message || '¡Bienvenido {usuario} a {servidor}! Eres nuestro miembro número #{contador}.';
      const formattedMsg = customMsg
        .replace(/{usuario}/g, `${member}`)
        .replace(/{user}/g, `${member}`)
        .replace(/{servidor}/g, member.guild.name)
        .replace(/{server}/g, member.guild.name)
        .replace(/{contador}/g, member.guild.memberCount);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎉 • ¡Nuevo Miembro!')
        .setDescription(formattedMsg)
        .addFields(
          { name: '👤 Usuario', value: `\`${member.user.tag}\``, inline: true },
          { name: '📊 Censo Actual', value: `Miembro #\`${member.guild.memberCount}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) });

      if (config.imageUrl) {
        embed.setImage(config.imageUrl);
      }

      await targetChannel.send({
        content: `${member}`,
        embeds: [embed]
      });

      await interaction.editReply({ 
        content: `✅ ¡Mensaje de prueba enviado exactamente como lo configuraste en ${targetChannel}!` 
      });

    } catch (error) {
      console.error('Error en /bienvenida-test:', error);
      await interaction.editReply({ 
        content: '❌ Ocurrió un error al ejecutar la prueba.' 
      });
    }
  }
};
