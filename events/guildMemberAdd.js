const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
  name: Events.GuildMemberAdd,
  
  async execute(member) {
    try {
      const guildId = member.guild.id;
      
      // 1. Consultar la configuración avanzada del servidor en la base de datos
      const config = await db.getWelcomeConfig(guildId);
      if (!config || !config.enabled) return;

      // 2. Asignar rol automático de forma segura si se encuentra configurado
      if (config.roleId) {
        const targetRole = member.guild.roles.cache.get(config.roleId);
        if (targetRole) {
          await member.roles.add(targetRole)
            .catch(err => console.error(`[Welcome System] No se pudo asignar el rol automático al usuario ${member.user.tag}:`, err));
        }
      }

      // 3. Verificar y obtener el canal de destino configurado
      const channelId = config.channelId;
      if (!channelId) return;
      
      const targetChannel = member.guild.channels.cache.get(channelId);
      if (!targetChannel) return;

      // 4. Procesar el mensaje personalizado reemplazando las variables dinámicas
      const rawMessage = config.message || '¡Bienvenido {usuario} a {servidor}! Eres nuestro miembro número #{contador}.';
      const formattedMessage = rawMessage
        .replace(/{usuario}/g, `${member}`)
        .replace(/{servidor}/g, member.guild.name)
        .replace(/{contador}/g, member.guild.memberCount);

      // 5. Construir el Embed principal con diseño profesional estilo Koya
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

      // 6. Adjuntar imagen o fondo personalizado si el servidor lo configuró
      if (config.imageUrl) {
        embed.setImage(config.imageUrl);
      }

      // 7. Despachar la tarjeta de bienvenida al canal de texto seleccionado
      await targetChannel.send({
        content: `${member}`, // Mención directa opcional fuera del embed para asegurar la notificación push
        embeds: [embed]
      });

    } catch (error) {
      console.error('[Critical Error] Ocurrió un fallo en el evento guildMemberAdd:', error);
    }
  },
};
