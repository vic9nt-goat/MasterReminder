const { SlashCommandBuilder, ChannelType, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder, MessageFlags } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bienvenida')
    .setDescription('Centro de control maestro y configuración avanzada del sistema de bienvenidas de Koya Engine')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('activar')
        .setDescription('Habilita o deshabilita el módulo global de bienvenidas en el servidor')
        .addBooleanOption(opt =>
          opt.setName('estado')
            .setDescription('Selecciona True para encender o False para apagar')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('canal')
        .setDescription('Establece el canal de texto principal para despachar las tarjetas de bienvenida')
        .addChannelOption(opt =>
          opt.setName('canal')
            .setDescription('Canal de texto seleccionado')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('mensaje')
        .setDescription('Personaliza el texto descriptivo del mensaje incrustado')
        .addStringOption(opt =>
          opt.setName('texto')
            .setDescription('Variables: {usuario}, {servidor}, {contador}')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('imagen')
        .setDescription('Configura una imagen, banner o fondo personalizado para la tarjeta visual estilo Koya')
        .addAttachmentOption(opt =>
          opt.setName('archivo')
            .setDescription('Sube una imagen (PNG/JPG) o introduce un enlace directo')
            .setRequired(false))
        .addStringOption(opt =>
          opt.setName('url')
            .setDescription('O pega la URL directa de la imagen de fondo')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('rol')
        .setDescription('Configura un rol automático que se otorga al instante de unirse el usuario')
        .addRoleOption(opt =>
          opt.setName('rol')
            .setDescription('Rol a asignar de forma automática')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('test')
        .setDescription('Simula una entrada de miembro para comprobar el diseño y funcionamiento actual'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Muestra un panel completo con todos los parámetros y estados configurados'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('resetear')
        .setDescription('Borra y restaura por completo todos los ajustes de bienvenida del servidor')),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const subcommand = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;

      if (subcommand === 'activar') {
        const estado = interaction.options.getBoolean('estado');
        await db.setWelcomeToggle(guildId, estado);

        const embed = new EmbedBuilder()
          .setColor(estado ? '#57F287' : '#ED4245')
          .setTitle(estado ? '🟢 Sistema de Bienvenidas Activado' : '🔴 Sistema de Bienvenidas Desactivado')
          .setDescription(`El módulo global de bienvenidas ha sido configurado a: **${estado ? 'Activado' : 'Desactivado'}** en la base de datos.`)
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'canal') {
        const channel = interaction.options.getChannel('canal');
        await db.setWelcomeChannel(guildId, channel.id);

        const embed = new EmbedBuilder()
          .setColor('#57F287')
          .setTitle('📢 Canal de Bienvenida Configurado')
          .setDescription(`Se ha establecido exitosamente el canal ${channel} (\`${channel.id}\`) para enviar las alertas automáticas.`)
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'mensaje') {
        const texto = interaction.options.getString('texto');
        await db.setWelcomeMessage(guildId, texto);

        const embed = new EmbedBuilder()
          .setColor('#57F287')
          .setTitle('💬 Mensaje Personalizado Guardado')
          .setDescription('El texto de bienvenida ha sido actualizado correctamente.')
          .addFields(
            { name: '📝 Nuevo Contenido', value: `\`\`\`${texto}\`\`\``, inline: false },
            { name: '💡 Etiquetas Dinámicas Disponibles', value: '• `{usuario}` -> Mención al nuevo miembro\n• `{servidor}` -> Nombre del servidor\n• `{contador}` -> Miembro número X', inline: false }
          )
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'imagen') {
        const archivo = interaction.options.getAttachment('archivo');
        const urlInput = interaction.options.getString('url');
        
        let imageUrl = null;
        if (archivo) {
          imageUrl = archivo.url;
        } else if (urlInput) {
          imageUrl = urlInput;
        }

        if (!imageUrl) {
          return await interaction.editReply({ content: '❌ Debes adjuntar un archivo de imagen válido o proporcionar una URL directa.' });
        }

        await db.setWelcomeImage(guildId, imageUrl);

        const embed = new EmbedBuilder()
          .setColor('#57F287')
          .setTitle('🖼️ Imagen de Bienvenida Actualizada')
          .setDescription('Se ha establecido el fondo visual estilo Koya para las tarjetas de bienvenida.')
          .setImage(imageUrl)
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'rol') {
        const role = interaction.options.getRole('rol');
        await db.setWelcomeRole(guildId, role.id);

        const embed = new EmbedBuilder()
          .setColor('#57F287')
          .setTitle('🏷️ Rol Automático Configurado')
          .setDescription(`El rol ${role} (\`${role.name}\`) se asignará automáticamente a cada usuario que ingrese al servidor.`)
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'test') {
        const config = await db.getWelcomeConfig(guildId) || {};
        const channelId = config.channelId || interaction.channel.id;
        const targetChannel = interaction.guild.channels.cache.get(channelId) || interaction.channel;

        const customMsg = config.message || `¡Bienvenido {usuario} a {servidor}! Eres nuestro miembro número #{contador}.`;
        const formattedMsg = customMsg
          .replace('{usuario}', `${interaction.user}`)
          .replace('{servidor}', interaction.guild.name)
          .replace('{contador}', interaction.guild.memberCount);

        const embed = new EmbedBuilder()
          .setColor('#FEE75C')
          .setTitle('🎉 ¡Nuevo Miembro Simulado!')
          .setDescription(formattedMsg)
          .addFields(
            { name: '👤 Usuario de Prueba', value: `${interaction.user.tag}`, inline: true },
            { name: '📊 Total Miembros', value: `${interaction.guild.memberCount}`, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: 'Simulación de Bienvenida • Koya Engine' });

        if (config.imageUrl) {
          embed.setImage(config.imageUrl);
        }

        await targetChannel.send({ embeds: [embed] });

        const successEmbed = new EmbedBuilder()
          .setColor('#57F287')
          .setTitle('🧪 Test Ejecutado con Éxito')
          .setDescription(`Se ha enviado una simulación de tarjeta de bienvenida al canal ${targetChannel}.`)
          .setTimestamp();

        return await interaction.editReply({ embeds: [successEmbed] });
      }

      if (subcommand === 'ver') {
        const config = await db.getWelcomeConfig(guildId) || {};
        const channel = interaction.guild.channels.cache.get(config.channelId);
        const role = interaction.guild.roles.cache.get(config.roleId);

        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('📋 Panel de Configuración • Bienvenidas')
          .setDescription('Estado actual de todos los parámetros registrados en la base de datos de alta disponibilidad:')
          .addFields(
            { name: '🟢 Estado Global', value: config.enabled ? '`Activado`' : '`Desactivado`', inline: true },
            { name: '📢 Canal Destino', value: channel ? `${channel}` : '`No configurado`', inline: true },
            { name: '🏷️ Rol Automático', value: role ? `${role}` : '`No configurado`', inline: true },
            { name: '💬 Mensaje Personalizado', value: config.message ? `\`\`\`${config.message}\`\`\`` : '`Predeterminado del sistema`', inline: false },
            { name: '🖼️ Imagen / Fondo', value: config.imageUrl ? `[Enlace de Imagen](${config.imageUrl})` : '`No configurada`', inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Koya Engine • Módulo de Bienvenidas' });

        if (config.imageUrl) {
          embed.setThumbnail(config.imageUrl);
        }

        return await interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === 'resetear') {
        await db.resetWelcomeConfig(guildId);

        const embed = new EmbedBuilder()
          .setColor('#ED4245')
          .setTitle('🗑️ Configuración Reseteada')
          .setDescription('Se han borrado todos los parámetros, canales, roles e imágenes del sistema de bienvenidas en este servidor.')
          .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error crítico en el comando /bienvenida:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('❌ Error Crítico del Sistema')
        .setDescription('Ocurrió un fallo al intentar procesar la configuración en la base de datos.')
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
      }
    }
  }
};
