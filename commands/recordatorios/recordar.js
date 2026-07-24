const { SlashCommandBuilder, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recordar')
    .setDescription('Crea un recordatorio en un canal específico')
    .addStringOption(option =>
      option.setName('mensaje')
        .setDescription('¿Qué quieres recordar?')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tiempo')
        .setDescription('Ejemplos: 10m, 1h, 2d, 30s')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal donde se enviará el recordatorio (opcional)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)),

  async execute(interaction) {
    const mensaje = interaction.options.getString('mensaje');
    const tiempoInput = interaction.options.getString('tiempo');
    const canalDestino = interaction.options.getChannel('canal') || interaction.channel;

    const tiempoMs = ms(tiempoInput);

    if (!tiempoMs || isNaN(tiempoMs)) {
      return await interaction.reply({
        content: '❌ El formato de tiempo no es válido. Usa formatos como `10s`, `5m`, `1h` o `2d`.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.reply({ 
      content: `✅ Recordatorio programado para enviarse en ${canalDestino} dentro de **${tiempoInput}**.`, 
      flags: MessageFlags.Ephemeral 
    });

    // Programar el envío con el formato de Embed y botón
    setTimeout(async () => {
      try {
        // Crear el Embed con el color rojo del logo (#D9383A)
        const embed = new EmbedBuilder()
          .setColor('#D9383A')
          .setTitle('⏰ ¡RECORDATORIO DE REMINDMASTER!')
          .setDescription(mensaje)
          .addFields(
            { name: '👤 Creador', value: `<@${interaction.user.id}>`, inline: false }
          )
          .setTimestamp();

        // Botón interactivo de +10 Minutos
        const boton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('extender_10m')
            .setLabel('+10 Minutos')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⏰')
        );

        await canalDestino.send({
          content: `<@${interaction.user.id}>`, // O si usabas @everyone: '@everyone'
          embeds: [embed],
          components: [boton]
        });
      } catch (error) {
        console.error('No se pudo enviar el recordatorio en el canal:', error);
      }
    }, tiempoMs);
  },
};