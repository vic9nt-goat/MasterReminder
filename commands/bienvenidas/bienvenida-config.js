// ==========================================
// ARCHIVO: commands/bienvenida/bienvenida-config.js
// ==========================================
const { SlashCommandBuilder, ChannelType, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bienvenida-config')
    .setDescription('Configura las bienvenidas guardando los datos reales')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(opt =>
      opt.setName('estado')
        .setDescription('Activa o desactiva el sistema')
        .setRequired(true))
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal de bienvenida')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('mensaje')
        .setDescription('Mensaje personalizado ({usuario}, {servidor}, {contador})')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('imagen')
        .setDescription('URL de la imagen')
        .setRequired(false))
    .addRoleOption(opt =>
      opt.setName('rol')
        .setDescription('Rol automático')
        .setRequired(false)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const guildId = interaction.guild.id;

      const estado = interaction.options.getBoolean('estado');
      const canal = interaction.options.getChannel('canal');
      const mensaje = interaction.options.getString('mensaje');
      const imagen = interaction.options.getString('imagen');
      const rol = interaction.options.getRole('rol');

      const updateData = {
        enabled: estado,
        channelId: canal.id
      };

      if (mensaje) updateData.message = mensaje;
      if (imagen) updateData.imageUrl = imagen;
      if (rol) updateData.roleId = rol.id;

      await GuildConfig.findOneAndUpdate(
        { guildId },
        { $set: updateData },
        { upsert: true, new: true }
      );

      const embed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('✅ Configuración Guardada')
        .setDescription('Los datos se han guardado perfectamente en la base de datos.')
        .addFields(
          { name: '🟢 Estado', value: estado ? '`Activado`' : '`Desactivado`', inline: true },
          { name: '📢 Canal', value: `${canal}`, inline: true },
          { name: '💬 Mensaje', value: mensaje ? `\`\`\`${mensaje}\`\`\`` : '`Por defecto`', inline: false }
        )
        .setTimestamp();

      if (imagen) embed.setImage(imagen);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error detallado en /bienvenida-config:', error);
      await interaction.editReply({ content: `❌ Error al guardar la configuración: \`${error.message}\`` });
    }
  }
};
