const { Events } = require('discord.js');

module.exports = {
  name: Events.GuildCreate,
  execute(guild) {
    if (guild.client.updatePresence) {
      guild.client.updatePresence();
    }
  }
};