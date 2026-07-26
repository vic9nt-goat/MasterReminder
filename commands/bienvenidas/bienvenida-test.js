// ==========================================
// ARCHIVO: commands/bienvenida/bienvenida-test.js
// ==========================================
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bienvenida-test')
    .setDescription('Prueba la bienvenida usando estrictamente el mensaje personalizado guardado')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const guildId = interaction.guild.id;
      const member = interaction.member;

      const config = await GuildConfig.findOne({ guildId });

      if (!config || !config.channelId) {
        return await interaction.editReply({ 
          content: '⚠️ No hay ninguna configuración guardada o falta definir el canal en `/bienvenida-config`.' 
        });
      }

      const targetChannel = interaction.guild.channels.cache.get(config.channelId);

      if (!targetChannel) {
        return await interaction.editReply({ 
          content: `⚠️ El canal configurado (<#${config.channelId}>) ya no existe o el bot no tiene acceso a él.` 
        });
      }

      if (!config.message) {
        return await interaction.editReply({ 
          content: '⚠️ No has configurado ningún mensaje personalizado en `/bienvenida-config`.' 
        });
      }

      const formattedMsg = config.message
        .replace(/{usuario}/g, `${member}`)
        .replace(/{user}/g, `${member}`)
        .replace(/{servidor}/g, member.guild.name)
        .replace(/{server}/g, member.guild.name)
        .replace(/{contador}/g, member.guild.memberCount);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎉 • ¡Nuevo Miembro!')
        .setDescription(formattedMsg)
        .setTimestamp()
        .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) });

      if (config.imageUrl) {
        embed.setImage(config.imageUrl);
      }

      await targetChannel.send({
        content: `${member}`,
        embeds: [embed]
      });

      if (config.roleId) {
        const role = interaction.guild.roles.cache.get(config.roleId);
        if (role) {
          try {
            await member.roles.add(role);
          } catch (e) {
            console.error('No se pudo asignar el rol en la prueba:', e);
          }
        }
      }

      await interaction.editReply({ 
        content: `✅ ¡Listo! Se envió exactamente tu mensaje personalizado al canal ${targetChannel}.` 
      });

    } catch (error) {
      console.error('Error en /bienvenida-test:', error);
      await interaction.editReply({ 
        content: '❌ Ocurrió un error al ejecutar la prueba.' 
      });
    }
  }
};
