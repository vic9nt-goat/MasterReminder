const { Events, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
  name: Events.GuildMemberAdd,
  
  async execute(member) {
    try {
      console.log(`[Welcome Debug] Evento detectado para el usuario: ${member.user.tag} en el servidor: ${member.guild.name}`);
      
      const guildId = member.guild.id;
      
      const config = await db.getWelcomeConfig(guildId);
      if (!config || !config.enabled) {
        console.log(`[Welcome Debug] Módulo desactivado o sin config para el servidor ${guildId}`);
        return;
      }

      if (config.roleId) {
        const targetRole = member.guild.roles.cache.get(config.roleId);
        if (targetRole) {
          await member.roles.add(targetRole)
            .catch(err => console.error(`[Welcome System] No se pudo asignar el rol automático al usuario ${member.user.tag}:`, err));
        }
      }

      const channelId = config.channelId;
      if (!channelId) {
        console.log(`[Welcome Debug] No hay un canal configurado para el servidor ${guildId}`);
        return;
      }
      
      const targetChannel = await member.guild.channels.fetch(channelId).catch(() => null);
      if (!targetChannel) {
        console.log(`[Welcome Debug] No se pudo encontrar el canal con ID ${channelId}`);
        return;
      }

      const rawMessage = config.message || '¡Bienvenido {usuario} a {servidor}! Eres nuestro miembro número #{contador}.';
      const formattedMessage = rawMessage
        .replace(/{usuario}/g, `${member}`)
        .replace(/{servidor}/g, member.guild.name)
        .replace(/{contador}/g, member.guild.memberCount);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎉 ¡Nuevo Miembro en el Servidor!')
        .setDescription(formattedMessage)
        .addFields(
          { name: '👤 Usuario Registrado', value: `\`${member.user.tag}\``, inline: true },
          { name: '📊 Censo Actual', value: `Miembro #\`${member.guild.memberCount}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ 
          text: `${member.guild.name} • Sistema Automatizado de Bienvenidas`, 
          iconURL: member.guild.iconURL({ dynamic: true }) 
        });

      if (config.imageUrl) {
        embed.setImage(config.imageUrl);
      }

      await targetChannel.send({
        content: `${member}`,
        embeds: [embed]
      });

      console.log(`[Welcome Debug] Bienvenida enviada exitosamente para ${member.user.tag}`);

    } catch (error) {
      console.error('[Critical Error] Ocurrió un fallo en el evento guildMemberAdd:', error);
    }
  },
};
