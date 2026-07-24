const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra el panel de ayuda y la lista de comandos de MasterReminder'),

  async execute(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setColor('#5865F2') // Color Blurple de Discord
      .setTitle('🤖 Panel de Ayuda | MasterReminder')
      .setDescription(
        '¡Hola! Soy **MasterReminder**, tu asistente personal de organización y productividad. ' +
        'Aquí tienes la lista de comandos disponibles para gestionar tus tareas y recordatorios.'
      )
      .addFields(
        {
          name: '⏰ Recordatorios',
          value: 
            '`/recordar` - Programa un recordatorio personal o en un canal específico.\n' +
            '`/mis-recordatorios` - Muestra la lista de tus recordatorios activos.\n' +
            '`/borrar-recordatorio` - Elimina un recordatorio pendiente.',
          inline: false,
        },
        {
          name: '⚙️ Configuración & Utilidad',
          value: 
            '`/help` - Muestra este panel de ayuda.\n' +
            '`/ping` - Comprueba la latencia del bot y de la base de datos.',
          inline: false,
        },
        {
          name: '💡 Ejemplos de uso',
          value: 
            '• `/recordar mensaje: Estudiar para el examen tiempo: 2h`\n' +
            '• `/recordar mensaje: Reunión de equipo tiempo: 30m canal: #anuncios`',
          inline: false,
        }
      )
      .setFooter({ 
        text: 'MasterReminder • Organización inteligente', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setTimestamp();

    // Botón opcional de soporte o enlace útil
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Servidor de Soporte')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/ejemplo') // Reemplaza por tu enlace real si tienes uno
    );

    await interaction.reply({ 
      embeds: [helpEmbed], 
      components: [row] 
    });
  },
};