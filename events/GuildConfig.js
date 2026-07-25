// ==========================================
// ARCHIVO: models/GuildConfig.js
// ==========================================
const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  welcomeChannelId: { type: String, default: null }, // Para compatibilidad por si acaso
  roleId: { type: String, default: null },
  notifyRoleId: { type: String, default: null },
  message: { type: String, default: null },
  imageUrl: { type: String, default: null }
});

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
