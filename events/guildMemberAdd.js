// ==========================================
// ARCHIVO: events/guildMemberAdd.js
// ==========================================
const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const guildId = member.guild.id;
      const config = await db.getWelcomeConfig(guildId);

      if (!config) return;
      const isEnabled = config.enabled === true || config.enabled === 'true' || config.enabled === 1;
      if (!isEnabled || !config.channelId) return;

      const targetChannel = member.guild.channels.cache.get(config.channelId);
      if (!targetChannel) return;

      const customMsg = config.message || '¡Bienvenido {usuario} a {servidor}! Eres nuestro miembro número #{contador}.';
      const formattedMsg = customMsg
        .replace(/{usuario}/g, `${member}`)
        .replace(/{servidor}/g, member.guild.name)
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

    } catch (error) {
      console.error('Error en el evento guildMemberAdd:', error);
    }
  }
};
