const { SlashCommandBuilder, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const ms = require('ms');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recordar')
    .setDescription('Centro avanzado de programación de recordatorios persistentes con múltiples opciones de personalización')
    .addStringOption(option =>
      option.setName('mensaje')
        .setDescription('¿Qué contenido deseas que te recordemos de forma exacta?')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tiempo')
        .setDescription('Tiempo de espera (Ejemplos: 30s, 15m, 2h, 1d)')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal de texto específico donde se enviará el recordatorio (Opcional)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Rol adicional que será mencionado junto contigo en el aviso (Opcional)')
        .setRequired(false)),

  async execute(interaction) {
    const mensaje = interaction.options.getString('mensaje');
    const tiempoInput = interaction.options.getString('tiempo');
    const canalDestino = interaction.options.getChannel('canal') || interaction.channel;
    const rolMencion = interaction.options.getRole('rol');

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const tiempoMs = ms(tiempoInput);

      if (!tiempoMs || isNaN(tiempoMs) || tiempoMs <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ED4245')
          .setTitle('❌ Error: Formato de Tiempo Inválido')
          .setDescription('El valor de tiempo proporcionado no cumple con el formato requerido por el sistema.\n\n' +
            '• **Formatos válidos:** `30s` (segundos), `10m` (minutos), `2h` (horas), `1d` (días).\n' +
            '• **Sugerencia:** Asegúrate de escribir un número seguido de la unidad correspondiente sin espacios extra.')
          .setTimestamp()
          .setFooter({ text: 'Sistema MasterReminder • Control de Errores' });

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      const remindAt = Date.now() + tiempoMs;
      const unixTimestamp = Math.floor(remindAt / 1000);

      // Guardar de forma persistente en MongoDB
      const savedReminder = await db.addReminder(
        interaction.user.id,
        canalDestino.id,
        interaction.guild.id,
        mensaje,
        remindAt,
        rolMencion ? rolMencion.id : null
      );

      const successEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('✅ Recordatorio Programado con Éxito')
        .setDescription('Tu alerta ha sido registrada exitosamente en nuestra base de datos centralizada de alta disponibilidad.\n\n' +
          'El sistema se encargará de despachar la notificación de manera automática en el plazo establecido, incluso si hay reinicios en el servidor.')
        .addFields(
          { name: '📝 Contenido del Recordatorio', value: `\`\`\`${mensaje}\`\`\``, inline: false },
          { name: '⏰ Fecha de Ejecución', value: `<t:${unixTimestamp}:F>\n(<t:${unixTimestamp}:R>)`, inline: true },
          { name: '📢 Canal de Destino', value: `${canalDestino} (\`${canalDestino.id}\`)`, inline: true },
          { name: '👤 Usuario Propietario', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true },
          { name: '🏷️ Rol de Mención', value: rolMencion ? `${rolMencion}` : 'Ninguno (Solo usuario)', inline: true },
          { name: '🆔 ID de Registro Único', value: `\`${savedReminder._id}\``, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'MasterReminder Engine • Todos los derechos reservados', iconURL: interaction.client.user.displayAvatarURL() });

      const manageButton = new ButtonBuilder()
        .setCustomId('view_my_reminders')
        .setLabel('Ver Mis Recordatorios')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📋');

      const actionRow = new ActionRowBuilder().addComponents(manageButton);

      const response = await interaction.editReply({ embeds: [successEmbed], components: [actionRow] });

      const collector = response.createMessageComponentCollector({ time: 45000 });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ No puedes interactuar con este botón.', ephemeral: true });
        }

        if (i.customId === 'view_my_reminders') {
          const userReminders = await db.getUserReminders(interaction.user.id);
          
          const panelEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📋 Resumen Rápido de Tus Alertas')
            .setDescription(`Actualmente cuentas con un total de \`${userReminders.length}\` recordatorio(s) activo(s) en la base de datos.\n\nPuedes administrarlos o borrarlos utilizando el comando dedicado \`/lista-recordatorios\`.`)
            .setTimestamp();

          await i.reply({ embeds: [panelEmbed], ephemeral: true });
        }
      });

      collector.on('end', async () => {
        try {
          const disabledButton = ButtonBuilder.from(manageButton).setDisabled(true);
          const disabledRow = new ActionRowBuilder().addComponents(disabledButton);
          await interaction.editReply({ components: [disabledRow] });
        } catch (err) {
          // Ignorar si el mensaje ya no existe
        }
      });

    } catch (error) {
      console.error('Error crítico al procesar el comando /recordar:', error);

      const fatalEmbed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('❌ Error Crítico del Sistema')
        .setDescription('Ocurrió un fallo inesperado al intentar comunicarse con MongoDB para almacenar el recordatorio.\n\nPor favor, contacta con soporte o intenta ejecutar el comando nuevamente en unos momentos.')
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [fatalEmbed], components: [] });
      } else {
        await interaction.reply({ embeds: [fatalEmbed], flags: MessageFlags.Ephemeral });
      }
    }
  },
};
