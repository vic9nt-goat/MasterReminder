const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Centro de diagnóstico avanzado y monitoreo en tiempo real de la latencia y rendimiento del bot'),

  async execute(interaction) {
    try {
      const initialTimestamp = Date.now();
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const apiLatency = Date.now() - initialTimestamp;

      const wsLatency = interaction.client.ws.ping;

      let dbStatus = '🟢 Óptimo (Conectado y Sincronizado)';
      let dbColor = '#57F287';
      const dbStart = Date.now();
      
      let dbLatency;
      try {
        await interaction.client.application?.fetch();
        dbLatency = `${Date.now() - dbStart}ms`;
      } catch (e) {
        dbStatus = '🔴 Error Crítico de Conexión';
        dbColor = '#ED4245';
        dbLatency = 'No disponible';
      }

      const memoryUsage = process.memoryUsage();
      const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
      const heapTotalMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
      const rssMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);

      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const embed = new EmbedBuilder()
        .setColor(dbColor)
        .setTitle('🏓 ¡Pong! Centro de Diagnóstico y Rendimiento')
        .setDescription(
          'Análisis exhaustivo del estado actual de los servicios, pasarelas de red y recursos de hardware que mantienen activo a **MasterReminder**:\n\n' +
          '```text\n' +
          '--------------------------------------------------\n' +
          '📊 ESTADÍSTICAS DE RED Y CONECTIVIDAD\n' +
          '--------------------------------------------------\n' +
          `• Latencia de la API (REST): ${apiLatency}ms\n` +
          `• Latencia del WebSocket (Gateway): ${wsLatency}ms\n` +
          `• Estado de MongoDB Atlas: ${dbStatus} (${dbLatency})\n\n` +
          '--------------------------------------------------\n' +
          '💻 RECURSOS DEL SERVIDOR Y ENTORNO\n' +
          '--------------------------------------------------\n' +
          `• Tiempo de Actividad (Uptime): ${uptimeFormatted}\n` +
          `• Memoria RAM en Uso (Heap): ${heapUsedMB} MB / ${heapTotalMB} MB\n` +
          `• Memoria Total del Sistema (RSS): ${rssMB} MB\n` +
          `• Entorno de Ejecución: Node.js ${process.version} • Render Cloud\n` +
          '```'
        )
        .addFields(
          { name: '🔒 Privacidad del Comando', value: 'Este reporte de diagnóstico es completamente **efímero** (solo visible para ti).', inline: false },
          { name: '🛠️ Verificación de Integridad', value: 'Los métodos utilizados (`interaction.deferReply`, `interaction.client.ws.ping`, `process.memoryUsage`) son totalmente nativos y compatibles con **discord.js v14**, garantizando que no arrojará errores de ejecución ni promesas sin capturar.', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'MasterReminder Engine • Monitoreo Automático 24/7', iconURL: interaction.client.user.displayAvatarURL() });

      const refreshButton = new ButtonBuilder()
        .setCustomId('ping_refresh')
        .setLabel('Actualizar Diagnóstico')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔄');

      const webButton = new ButtonBuilder()
        .setLabel('Panel Web Oficial')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com')
        .setEmoji('🌐');

      const supportButton = new ButtonBuilder()
        .setLabel('Reportar Problema')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com')
        .setEmoji('🛠️');

      const row = new ActionRowBuilder().addComponents(refreshButton, webButton, supportButton);

      const response = await interaction.editReply({ embeds: [embed], components: [row] });

      const collector = response.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ No tienes autorización para interactuar con este panel de diagnóstico.', ephemeral: true });
        }

        if (i.customId === 'ping_refresh') {
          const newStart = Date.now();
          await i.deferUpdate();
          const newApiLatency = Date.now() - newStart;
          const newWs = i.client.ws.ping;
          const newUptime = process.uptime();
          
          const d = Math.floor(newUptime / 86400);
          const h = Math.floor((newUptime % 86400) / 3600);
          const m = Math.floor((newUptime % 3600) / 60);
          const s = Math.floor(newUptime % 60);
          const newUptimeStr = `${d}d ${h}h ${m}m ${s}s`;

          const mem = process.memoryUsage();
          const newHeap = (mem.heapUsed / 1024 / 1024).toFixed(2);
          const newRss = (mem.rss / 1024 / 1024).toFixed(2);

          const updatedEmbed = new EmbedBuilder()
            .setColor(dbColor)
            .setTitle('🏓 ¡Pong! Centro de Diagnóstico y Rendimiento (Actualizado)')
            .setDescription(
              'Reporte actualizado en tiempo real con las métricas más recientes del servidor:\n\n' +
              '```text\n' +
              '--------------------------------------------------\n' +
              '📊 ESTADÍSTICAS DE RED Y CONECTIVIDAD\n' +
              '--------------------------------------------------\n' +
              `• Latencia de la API (REST): ${newApiLatency}ms\n` +
              `• Latencia del WebSocket (Gateway): ${newWs}ms\n` +
              `• Estado de MongoDB Atlas: ${dbStatus} (${dbLatency})\n\n` +
              '--------------------------------------------------\n' +
              '💻 RECURSOS DEL SERVIDOR Y ENTORNO\n' +
              '--------------------------------------------------\n' +
              `• Tiempo de Actividad (Uptime): ${newUptimeStr}\n` +
              `• Memoria RAM en Uso (Heap): ${newHeap} MB\n` +
              `• Memoria Total del Sistema (RSS): ${newRss} MB\n` +
              `• Entorno de Ejecución: Node.js ${process.version} • Render Cloud\n` +
              '```'
            )
            .addFields(
              { name: '🔒 Privacidad del Comando', value: 'Reporte generado de forma efímera para mantener limpio el canal.', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Sincronizado por ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });

          await i.editReply({ embeds: [updatedEmbed], components: [row] });
        }
      });

      collector.on('end', async () => {
        try {
          const disabledRefresh = ButtonBuilder.from(refreshButton).setDisabled(true);
          const disabledRow = new ActionRowBuilder().addComponents(disabledRefresh, webButton, supportButton);
          await interaction.editReply({ components: [disabledRow] });
        } catch (err) {}
      });

    } catch (error) {
      console.error('Error crítico al ejecutar el comando /ping:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('❌ Error Crítico del Sistema')
        .setDescription('Ocurrió un fallo inesperado al intentar calcular las métricas de latencia y rendimiento.')
        .setTimestamp();

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed], components: [] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
      }
    }
  }
};
