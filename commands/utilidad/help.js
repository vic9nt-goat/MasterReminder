const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Centro de asistencia avanzado con menús interactivos, soporte técnico y listado detallado de módulos'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const mainEmbed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('🌟 Panel Central de Asistencia • MasterReminder')
        .setDescription(
          '» **Menú de ayuda principal**\n' +
          'Bienvenido al sistema automatizado de soporte y navegación. Actualmente tengo un total de `4` categorías operativas y comandos avanzados desplegados para optimizar la gestión de tus alertas y servidores.\n\n' +
          '» **Categorías Disponibles en el Servidor**\n' +
          '```text\n' +
          'Configuración       Gestión administrativa y roles de mención automáticos\n' +
          'Recordatorios       Creación, listado y borrado avanzado de alertas\n' +
          'Bienvenidas         Módulo automatizado estilo Koya (config, test, reset)\n' +
          'Utilidades          Paneles interactivos, ayuda y enlaces oficiales\n' +
          '```\n' +
          '» **Estadísticas del Sistema**\n' +
          '• **Estado de la Base de Datos:** `Conectado a MongoDB Atlas`\n' +
          '• **Latencia de Respuesta:** `Estable`\n' +
          '• **Versión del Motor:** `v2.4.0-stable`\n\n' +
          '» **Enlaces y Recursos Útiles**\n' +
          '[Website Oficial](https://discord.com) | [Wiki & Documentación](https://discord.com) | [Política de Privacidad](https://discord.com) | [Soporte Técnico](https://discord.com)'
        )
        .setTimestamp()
        .setFooter({ text: '© 2026 MasterReminder Engine • Todos los derechos reservados', iconURL: interaction.client.user.displayAvatarURL() });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('📂 Selecciona una categoría para explorar...')
        .addOptions([
          {
            label: 'Configuración',
            description: 'Gestiona los roles de notificación y parámetros del servidor',
            value: 'cat_config',
            emoji: '⚙️'
          },
          {
            label: 'Recordatorios',
            description: 'Crea, consulta tu bandeja y borra alertas pendientes',
            value: 'cat_reminders',
            emoji: '⏰'
          },
          {
            label: 'Bienvenidas',
            description: 'Sistema automatizado de bienvenidas estilo Koya (config, test, reset)',
            value: 'cat_welcome',
            emoji: '🎉'
          },
          {
            label: 'Utilidades',
            description: 'Información general del bot, accesos y ayuda interactiva',
            value: 'cat_utils',
            emoji: '🛠️'
          }
        ]);

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      const webButton = new ButtonBuilder()
        .setLabel('Mirar en la página web')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com')
        .setEmoji('🌐');

      const supportButton = new ButtonBuilder()
        .setLabel('Servidor de Soporte')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com')
        .setEmoji('💬');

      const closeButton = new ButtonBuilder()
        .setCustomId('help_close')
        .setLabel('Cerrar Menú')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('✖️');

      const buttonRow = new ActionRowBuilder().addComponents(closeButton, webButton, supportButton);

      const response = await interaction.editReply({
        embeds: [mainEmbed],
        components: [selectRow, buttonRow]
      });

      const collector = response.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ No puedes usar este menú de ayuda interactivo.', ephemeral: true });
        }

        if (i.customId === 'help_close') {
          return await i.update({ content: '🔒 Menú de ayuda cerrado de forma segura.', embeds: [], components: [] });
        }

        if (i.customId === 'help_category_select') {
          const selectedVal = i.values[0];
          let subEmbed = new EmbedBuilder().setColor('#5865F2').setTimestamp();

          if (selectedVal === 'cat_config') {
            subEmbed
              .setTitle('⚙️ Categoría: Configuración y Administración')
              .setDescription('Panel de control para administradores de servidores destinados a configurar las alertas globales:')
              .addFields(
                { name: '/rol-notificacion establecer <rol>', value: 'Configura de forma persistente el rol por defecto que será mencionado en las alertas.', inline: false },
                { name: '/rol-notificacion ver', value: 'Consulta detalladamente cuál es el rol configurado actualmente en este servidor.', inline: false },
                { name: '/rol-notificacion remover', value: 'Elimina por completo el rol de notificación preestablecido.', inline: false }
              )
              .setFooter({ text: 'Requiere permisos de Administrador' });
          } else if (selectedVal === 'cat_reminders') {
            subEmbed
              .setTitle('⏰ Categoría: Sistema de Recordatorios')
              .setDescription('Herramientas avanzadas de alta disponibilidad respaldadas por MongoDB Atlas para nunca olvidar nada:')
              .addFields(
                { name: '/recordar <mensaje> <tiempo> [canal] [rol]', value: 'Programa una alerta persistente que sobrevivirá a cualquier reinicio del bot.', inline: false },
                { name: '/lista-recordatorios', value: 'Despliega tu centro de control privado con todas tus alertas activas y botones de sincronización.', inline: false },
                { name: '/borrar-recordatorio <id>', value: 'Elimina de forma segura un recordatorio específico utilizando su identificador único (_id).', inline: false }
              )
              .setFooter({ text: 'Sistema de persistencia activado' });
          } else if (selectedVal === 'cat_welcome') {
            subEmbed
              .setTitle('🎉 Categoría: Sistema de Bienvenidas (Koya Style)')
              .setDescription('Módulo avanzado para gestionar la recepción de nuevos miembros en tu servidor con tarjetas y automatización:')
              .addFields(
                { name: '/bienvenida-config [estado] [canal] [rol] [mensaje] [imagen]', value: 'Centro maestro de configuración para activar, definir canal, rol automático, texto personalizado y fondo.', inline: false },
                { name: '/bienvenida-test', value: 'Simula una entrada de miembro para comprobar el diseño visual y el funcionamiento actual.', inline: false },
                { name: '/bienvenida-reset', value: 'Borra y restaura por completo todos los ajustes de bienvenida del servidor.', inline: false }
              )
              .setFooter({ text: 'Módulo Automatizado de Bienvenidas' });
          } else if (selectedVal === 'cat_utils') {
            subEmbed
              .setTitle('🛠️ Categoría: Utilidades y Soporte')
              .setDescription('Información técnica, manuales de uso y accesos directos al ecosistema del bot:')
              .addFields(
                { name: '/help', value: 'Abre este panel interactivo completo con selector dinámico de categorías.', inline: false },
                { name: 'Soporte 24/7', value: 'Utiliza los botones inferiores para unirte al servidor oficial de ayuda ante cualquier inconveniente.', inline: false }
              )
              .setFooter({ text: 'MasterReminder Utilities' });
          }

          await i.update({ embeds: [subEmbed], components: [selectRow, buttonRow] });
        }
      });

      collector.on('end', async () => {
        try {
          const disabledSelect = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
          const disabledClose = ButtonBuilder.from(closeButton).setDisabled(true);
          const disabledRow1 = new ActionRowBuilder().addComponents(disabledSelect);
          const disabledRow2 = new ActionRowBuilder().addComponents(disabledClose, webButton, supportButton);
          await interaction.editReply({ components: [disabledRow1, disabledRow2] });
        } catch (err) {}
      });

    } catch (error) {
      console.error('Error crítico al ejecutar el comando /help:', error);
      await interaction.editReply({ content: '❌ Ocurrió un error crítico al intentar desplegar el menú de ayuda.', embeds: [], components: [] });
    }
  }
};
