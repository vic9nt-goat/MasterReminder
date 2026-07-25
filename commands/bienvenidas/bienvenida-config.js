// ==========================================
// ARCHIVO: commands/bienvenida/bienvenida-config.js
// ==========================================
const { SlashCommandBuilder, ChannelType, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bienvenida-config')
    .setDescription('Centro maestro de configuración y gestión del sistema de bienvenidas de Koya Engine')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(opt =>
      opt.setName('estado')
        .setDescription('Activa (True) o desactiva (False) el módulo global de bienvenidas')
        .setRequired(false))
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal de texto donde se despacharán las tarjetas')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false))
    .addRoleOption(opt =>
      opt.setName('rol')
        .setDescription('Rol automático que se otorgará al entrar el miembro')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('mensaje')
        .setDescription('Texto personalizado (Usa {usuario}, {servidor}, {contador})')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('imagen')
        .setDescription('URL directa de la imagen de fondo estilo Koya')
        .setRequired(false))
    .addAttachmentOption(opt =>
      opt.setName('imagen_archivo')
        .setDescription('Sube o pega una imagen directamente desde tu dispositivo')
        .setRequired(false)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const guildId = interaction.guild.id;

      const estado = interaction.options.getBoolean('estado');
      const canal = interaction.options.getChannel('canal');
      const rol = interaction.options.getRole('rol');
      const mensaje = interaction.options.getString('mensaje');
      const imagenUrlInput = interaction.options.getString('imagen');
      const imagenArchivo = interaction.options.getAttachment('imagen_archivo');

      // Si se subió un archivo, este tiene prioridad absoluta como enlace directo
      const imagen = imagenArchivo ? imagenArchivo.url : imagenUrlInput;

      if (estado === null && !canal && !rol && !mensaje && !imagen) {
        const config = await db.getWelcomeConfig(guildId) || {};
        const targetChannel = interaction.guild.channels.cache.get(config.channelId);
        const targetRole = interaction.guild.roles.cache.get(config.roleId);

        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('📋 Panel de Configuración • Bienvenidas')
          .setDescription('Estado actual de los parámetros registrados en la base de datos:')
          .addFields(
            { name: '🟢 Estado Global', value: config.enabled ? '`Activado`' : '`Desactivado`', inline: true },
            { name: '📢 Canal Destino', value: targetChannel ? `${targetChannel}` : '`No configurado`', inline: true },
            { name: '🏷️ Rol Automático', value: targetRole ? `${targetRole}` : '`No configurado`', inline: true },
            { name: '💬 Mensaje Personalizado', value: config.message ? `\`\`\`${config.message}\`\`\`` : '`Predeterminado del sistema`', inline: false },
            { name: '🖼️ Imagen / Fondo', value: config.imageUrl ? `[Enlace de Imagen](${config.imageUrl})` : '`No configurada`', inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Koya Engine • Sistema de Bienvenidas' });

        if (config.imageUrl) embed.setImage(config.imageUrl);

        return await interaction.editReply({ embeds: [embed] });
      }

      const updateData = {};
      const fields = [];

      if (estado !== null) {
        updateData.enabled = estado;
        await db.setWelcomeToggle(guildId, estado);
        fields.push({ name: '🟢 Estado Global', value: estado ? '`Activado`' : '`Desactivado`', inline: true });
      }

      if (canal) {
        updateData.channelId = canal.id;
        await db.setWelcomeChannel(guildId, canal.id);
        fields.push({ name: '📢 Canal Destino', value: `${canal}`, inline: true });
      }

      if (rol) {
        updateData.roleId = rol.id;
        await db.setWelcomeRole(guildId, rol.id);
        fields.push({ name: '🏷️ Rol Automático', value: `${rol}`, inline: true });
      }

      if (mensaje) {
        updateData.message = mensaje;
        await db.setWelcomeMessage(guildId, mensaje);
        fields.push({ name: '💬 Mensaje Actualizado', value: `\`\`\`${mensaje}\`\`\``, inline: false });
      }

      if (imagen) {
        updateData.imageUrl = imagen;
        await db.setWelcomeImage(guildId, imagen);
        fields.push({ name: '🖼️ Imagen Establecida', value: `[Ver Imagen](${imagen})`, inline: false });
      }

      const successEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('✅ Configuración Actualizada con Éxito')
        .setDescription('Los parámetros indicados han sido guardados correctamente en la base de datos:')
        .addFields(fields)
        .setTimestamp()
        .setFooter({ text: 'Koya Engine • Sincronización Exitosa' });

      if (imagen) {
        successEmbed.setImage(imagen);
      }

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error crítico en /bienvenida-config:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('❌ Error del Sistema')
        .setDescription('Ocurrió un fallo al intentar actualizar los parámetros de bienvenida.')
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
