const { SlashCommandBuilder, ChannelType, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../database'); // Asegúrate de que apunte correctamente a tu base de datos

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats-setup')
    .setDescription('Configura y crea automáticamente los canales de estadísticas del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const guild = interaction.guild;

      // Creamos una categoría para organizar los canales de estadísticas
      const category = await guild.channels.create({
        name: '📊 STATS DEL SERVIDOR',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.Connect], // Nadie puede conectarse a estos canales de voz
          },
        ],
      });

      // Contamos miembros y bots iniciales
      const totalMembers = guild.memberCount;
      const totalBots = guild.members.cache.filter(m => m.user.bot).size;
      const totalHumans = totalMembers - totalBots;

      // Creamos los canales de voz con las estadísticas iniciales
      const memberChannel = await guild.channels.create({
        name: `👥 Miembros: ${totalMembers}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
      });

      const humanChannel = await guild.channels.create({
        name: `👤 Humanos: ${totalHumans}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
      });

      const botChannel = await guild.channels.create({
        name: `🤖 Bots: ${totalBots}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
      });

      // Guardamos los IDs en la base de datos para que el actualizador los reconozca
      await db.setStatsConfig(guild.id, {
        categoryId: category.id,
        memberChannelId: memberChannel.id,
        humanChannelId: humanChannel.id,
        botChannelId: botChannel.id,
      });

      const embed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('📊 ¡Canales de Estadísticas Creados!')
        .setDescription('Se han configurado y bloqueado los canales de voz correctamente en una nueva categoría.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error en /stats-setup:', error);
      await interaction.editReply({ content: '❌ Ocurrió un error al intentar crear los canales de estadísticas.' });
    }
  }
};