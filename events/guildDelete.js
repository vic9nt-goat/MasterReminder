const { Events } = require('discord.js');

module.exports = {
  name: Events.GuildDelete,
  execute(guild) {
    if (guild.client.updatePresence) {
      guild.client.updatePresence();
    }
  }
};