const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bienvenida-test')
    .setDescription('Simula una entrada de miembro para comprobar el diseño visual y el funcionamiento actual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const guildId = interaction.guild.id;

      const config = await db.getWelcomeConfig(guildId) || {};
      const channelId = config.channelId || interaction.channel.id;
      
      const targetChannel = await interaction.guild.channels.fetch(channelId).catch(() => null) || interaction.channel;

      const customMsg = config.message || '¡Bienvenido {usuario} a {servidor}! Eres nuestro miembro número #{contador}.';
      const formattedMsg = customMsg
        .replace(/{usuario}/g, `${interaction.user}`)
        .replace(/{servidor}/g, interaction.guild.name)
        .replace(/{contador}/g, interaction.guild.memberCount);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎉 ¡Nuevo Miembro en el Servidor!')
        .setDescription(formattedMsg)
        .addFields(
          { name: '👤 Usuario de Prueba', value: `\`${interaction.user.tag}\``, inline: true },
          { name: '📊 Censo Actual', value: `Miembro #\`${interaction.guild.memberCount}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `${interaction.guild.name} • Simulación de Bienvenida`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

      if (config.imageUrl) {
        embed.setImage(config.imageUrl);
      }

      await targetChannel.send({
        content: `${interaction.user}`,
        embeds: [embed]
      });

      const successEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('🧪 Test Ejecutado con Éxito')
        .setDescription(`Se ha despachado una tarjeta de bienvenida simulada al canal ${targetChannel}.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error en /bienvenida-test:', error);
      await interaction.editReply({ content: '❌ Ocurrió un error al intentar enviar la simulación.' });
    }
  }
};
