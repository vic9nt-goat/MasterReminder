const { Schema, model } = require('mongoose');

const guildConfigSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  notifyRoleId: { type: String, default: null }
}, { timestamps: true });

module.exports = model('GuildConfig', guildConfigSchema);