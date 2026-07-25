const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('borrar-recordatorio')
    .setDescription('Sistema avanzado para eliminar y gestionar recordatorios pendientes')
    .addStringOption(opt =>
      opt.setName('id')
        .setDescription('El ID único del recordatorio que deseas eliminar')
        .setRequired(true)),

  async execute(interaction) {
    const id = interaction.options.getString('id');

    try {
      await interaction.deferReply({ ephemeral: true });

      const userReminders = await db.getUserReminders(interaction.user.id);
      const exists = userReminders.find(r => r._id.toString() === id);

      if (!exists) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ED4245')
          .setTitle('⚠️ Error: Recordatorio No Encontrado')
          .setDescription(`No hemos podido encontrar ningún recordatorio activo asociado al identificador único proporcionado.\n\n` +
            `• **ID buscado:** \`${id}\`\n` +
            `• **Sugerencia:** Asegúrate de copiar el ID exacto desde tu lista de recordatorios activos utilizando el comando correspondiente.`)
          .setTimestamp()
          .setFooter({ text: 'Sistema de Gestión MasterReminder', iconURL: interaction.client.user.displayAvatarURL() });

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      const confirmEmbed = new EmbedBuilder()
        .setColor('#FEE75C')
        .setTitle('⚠️ Confirmación de Eliminación')
        .setDescription(`Estás apunto de eliminar permanentemente el siguiente recordatorio:\n\n` +
          `• **Mensaje:** "${exists.message}"\n` +
          `• **ID:** \`${exists._id}\`\n` +
          `• **Programado para:** <t:${Math.floor(new Date(exists.remindAt).getTime() / 1000)}:F>\n\n` +
          `¿Estás totalmente seguro de que deseas proceder? Esta acción no se puede deshacer.`)
        .setTimestamp();

      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_delete')
        .setLabel('Sí, eliminar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️');

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_delete')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✖️');

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      const response = await interaction.editReply({ embeds: [confirmEmbed], components: [row] });

      const collector = response.createMessageComponentCollector({ time: 30000 });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ No puedes interactuar con este botón.', ephemeral: true });
        }

        if (i.customId === 'confirm_delete') {
          await db.deleteReminder(id);

          const successEmbed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('🗑️ Recordatorio Eliminado Exitosamente')
            .setDescription('El elemento seleccionado ha sido borrado de forma permanente de nuestros registros en la base de datos.')
            .addFields(
              { name: '📝 Contenido del Recordatorio', value: `\`\`\`${exists.message}\`\`\``, inline: false },
              { name: '🆔 Identificador', value: `\`${exists._id}\``, inline: true },
              { name: '👤 Usuario', value: `${interaction.user.tag}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Acción completada con éxito' });

          await i.update({ embeds: [successEmbed], components: [] });
          collector.stop();
        } else {
          const cancelEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🛡️ Operación Cancelada')
            .setDescription('La solicitud de eliminación ha sido cancelada por el usuario. Tu recordatorio sigue intacto.')
            .setTimestamp();

          await i.update({ embeds: [cancelEmbed], components: [] });
          collector.stop();
        }
      });

      collector.on('end', async collected => {
        if (collected.size === 0) {
          const timeoutEmbed = new EmbedBuilder()
            .setColor('#95a5a6')
            .setTitle('⏱️ Tiempo Agotado')
            .setDescription('El tiempo de espera para confirmar la eliminación ha expirado. No se ha realizado ningún cambio.')
            .setTimestamp();

          await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('Error crítico al procesar la eliminación del recordatorio:', error);
      const fatalEmbed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('❌ Error Crítico del Sistema')
        .setDescription('Ocurrió un error inesperado al intentar comunicarse con la base de datos para borrar el registro.')
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [fatalEmbed], components: [] });
      } else {
        await interaction.reply({ embeds: [fatalEmbed], ephemeral: true });
      }
    }
  }
};
