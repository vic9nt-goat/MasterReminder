const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lista-recordatorios')
    .setDescription('Centro de control avanzado para visualizar, filtrar y gestionar todos tus recordatorios pendientes'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const reminders = await db.getUserReminders(interaction.user.id);

      if (!reminders || reminders.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('📭 Panel de Recordatorios Vacío')
          .setDescription('Actualmente no posees ningún registro o alerta activa dentro de nuestra base de datos.\n\n' +
            '• Puedes programar una nueva alerta utilizando los comandos interactivos del bot.\n' +
            '• Si crees que esto es un error, intenta actualizar la bandeja utilizando el botón inferior.')
          .setTimestamp()
          .setFooter({ text: 'Sistema MasterReminder • Gestión de Alertas', iconURL: interaction.client.user.displayAvatarURL() });

        const emptyButton = new ButtonBuilder()
          .setCustomId('refresh_empty')
          .setLabel('Verificar de Nuevo')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔄');

        const emptyRow = new ActionRowBuilder().addComponents(emptyButton);

        const response = await interaction.editReply({ embeds: [emptyEmbed], components: [emptyRow] });

        const emptyCollector = response.createMessageComponentCollector({ time: 30000 });
        emptyCollector.on('collect', async i => {
          if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ No puedes usar este botón.', ephemeral: true });
          const freshCheck = await db.getUserReminders(interaction.user.id);
          if (freshCheck && freshCheck.length > 0) {
            await i.update({ content: '✅ ¡Se han encontrado recordatorios nuevos! Ejecuta el comando nuevamente.', embeds: [], components: [] });
          } else {
            await i.reply({ content: '⚠️ La bandeja sigue completamente vacía.', ephemeral: true });
          }
        });
        return;
      }

      // Función auxiliar para formatear la lista de recordatorios
      const generateListText = (items) => {
        return items.map((r, index) => {
          const timestamp = Math.floor(new Date(r.remindAt).getTime() / 1000);
          const dateStr = `<t:${timestamp}:R>`;
          const exactDate = `<t:${timestamp}:F>`;
          return `**${index + 1}.** 📌 **Mensaje:** \`${r.message}\`\n` +
                 `   • 🆔 **ID Único:** \`${r._id}\`\n` +
                 `   • ⏰ **Ejecución:** ${exactDate} (${dateStr})\n` +
                 `   • 🌐 **Canal ID:** \`${r.channelId}\`\n`;
        }).join('\n');
      };

      const embed = new EmbedBuilder()
        .setColor('#FEE75C')
        .setTitle('📋 Centro de Control de Tus Recordatorios')
        .setDescription(`Aquí tienes una vista detallada y completa de todas tus alertas programadas actualmente:\n\n${generateListText(reminders)}`)
        .addFields(
          { name: '📊 Total de Alertas Activas', value: `\`${reminders.length}\` recordatorio(s)`, inline: true },
          { name: '👤 Propietario', value: `${interaction.user.tag}`, inline: true },
          { name: '🔒 Privacidad', value: 'Privado (Solo visible para ti)', inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Panel interactivo solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      const refreshButton = new ButtonBuilder()
        .setCustomId('refresh_reminders')
        .setLabel('Actualizar Panel')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔄');

      const infoButton = new ButtonBuilder()
        .setCustomId('info_reminders')
        .setLabel('Ayuda y Tips')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💡');

      const row = new ActionRowBuilder().addComponents(refreshButton, infoButton);

      const response = await interaction.editReply({ embeds: [embed], components: [row] });

      const collector = response.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ No tienes autorización para interactuar con este panel de control.', ephemeral: true });
        }

        if (i.customId === 'refresh_reminders') {
          await i.deferUpdate();
          const updatedReminders = await db.getUserReminders(interaction.user.id);

          if (!updatedReminders || updatedReminders.length === 0) {
            const emptyRefreshed = new EmbedBuilder()
              .setColor('#5865F2')
              .setTitle('📭 Bandeja Actualizada: Vacía')
              .setDescription('Ya no quedan recordatorios activos en este momento.')
              .setTimestamp();

            return await i.editReply({ embeds: [emptyRefreshed], components: [] });
          }

          const updatedEmbed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle('📋 Centro de Control de Tus Recordatorios (Actualizado)')
            .setDescription(`Lista sincronizada en tiempo real con la base de datos:\n\n${generateListText(updatedReminders)}`)
            .addFields(
              { name: '📊 Total de Alertas Activas', value: `\`${updatedReminders.length}\` recordatorio(s)`, inline: true },
              { name: '👤 Propietario', value: `${interaction.user.tag}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Sincronizado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

          await i.editReply({ embeds: [updatedEmbed], components: [row] });
        } 
        else if (i.customId === 'info_reminders') {
          const infoEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('💡 Información sobre tus Recordatorios')
            .setDescription('Aquí tienes algunos consejos útiles para gestionar tus alertas de manera eficiente dentro del servidor:')
            .addFields(
              { name: '🗑️ ¿Cómo borrar uno?', value: 'Usa el comando `/borrar-recordatorio` seguido del ID único que aparece en tu lista.', inline: false },
              { name: '⏰ Formato de tiempo', value: 'Las fechas se muestran adaptadas automáticamente a tu zona horaria local de Discord.', inline: false },
              { name: '🔄 Sincronización', value: 'Haz clic en "Actualizar Panel" tantas veces como quieras para verificar cambios recientes.', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Sistema de Ayuda MasterReminder' });

          await i.reply({ embeds: [infoEmbed], ephemeral: true });
        }
      });

      collector.on('end', async () => {
        try {
          const disabledRefresh = ButtonBuilder.from(refreshButton).setDisabled(true);
          const disabledInfo = ButtonBuilder.from(infoButton).setDisabled(true);
          const disabledRow = new ActionRowBuilder().addComponents(disabledRefresh, disabledInfo);
          await interaction.editReply({ components: [disabledRow] });
        } catch (err) {
          // Ignorar si el mensaje ya no existe
        }
      });

    } catch (error) {
      console.error('Error crítico al procesar la lista de recordatorios:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('❌ Error Crítico del Sistema')
        .setDescription('Ocurrió un error inesperado al intentar consultar los registros en la base de datos principal.')
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed], components: [] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};
