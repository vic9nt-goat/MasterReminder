// ==========================================
// ARCHIVO: database/index.js
// ==========================================
const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const GuildConfig = require('../models/GuildConfig');

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

if (mongoUri && (mongoUri.startsWith("mongodb://") || mongoUri.startsWith("mongodb+srv://"))) {
  mongoose.connect(mongoUri)
    .then(() => console.log('🍃 Conectado exitosamente a MongoDB Atlas'))
    .catch(err => console.error('❌ Error conectando a MongoDB:', err));
} else {
  console.error('❌ Error conectando a MongoDB: MongoParseError: Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"');
}

module.exports = {
  setGuildRole: async (guildId, roleId) => {
    return await GuildConfig.findOneAndUpdate(
      { guildId },
      { notifyRoleId: roleId },
      { upsert: true, new: true }
    );
  },

  getGuildRole: async (guildId) => {
    const config = await GuildConfig.findOne({ guildId });
    return config ? config.notifyRoleId : null;
  },

  addReminder: async (userId, channelId, guildId, message, remindAt, targetRoleId = null) => {
    const newReminder = new Reminder({
      userId,
      channelId,
      guildId,
      message,
      remindAt,
      targetRoleId
    });
    return await newReminder.save();
  },

  getDueReminders: async () => {
    return await Reminder.find({ remindAt: { $lte: Date.now() } });
  },

  getUserReminders: async (userId) => {
    return await Reminder.find({ userId }).sort({ remindAt: 1 });
  },

  deleteReminder: async (id) => {
    return await Reminder.findByIdAndDelete(id);
  },

  // ==========================================
  // SISTEMA DE BIENVENIDAS
  // ==========================================
  getWelcomeConfig: async (guildId) => {
    const config = await GuildConfig.findOne({ guildId });
    if (!config) return null;
    return {
      enabled: config.enabled === true || config.enabled === 'true' || config.enabled === 1 || config.estado === true || config.estado === 'true',
      channelId: config.channelId || config.welcomeChannelId,
      roleId: config.roleId,
      message: config.message,
      imageUrl: config.imageUrl
    };
  },

  setWelcomeToggle: async (guildId, enabled) => {
    return await GuildConfig.findOneAndUpdate(
      { guildId },
      { enabled: Boolean(enabled) },
      { upsert: true, new: true }
    );
  },

  setWelcomeChannel: async (guildId, channelId) => {
    return await GuildConfig.findOneAndUpdate(
      { guildId },
      { channelId },
      { upsert: true, new: true }
    );
  },

  setWelcomeRole: async (guildId, roleId) => {
    return await GuildConfig.findOneAndUpdate(
      { guildId },
      { roleId },
      { upsert: true, new: true }
    );
  },

  setWelcomeMessage: async (guildId, message) => {
    return await GuildConfig.findOneAndUpdate(
      { guildId },
      { message },
      { upsert: true, new: true }
    );
  },

  setWelcomeImage: async (guildId, imageUrl) => {
    return await GuildConfig.findOneAndUpdate(
      { guildId },
      { imageUrl },
      { upsert: true, new: true }
    );
  },

  resetWelcomeConfig: async (guildId) => {
    return await GuildConfig.findOneAndUpdate(
      { guildId },
      { 
        $unset: { 
          enabled: "", 
          channelId: "", 
          roleId: "", 
          message: "", 
          imageUrl: "" 
        } 
      },
      { new: true }
    );
  },

  // ==========================================
  // CANALES DE ESTADÍSTICAS (STATS)
  // ==========================================
  setStatsConfig: async (guildId, data) => {
    return await GuildConfig.findOneAndUpdate(
      { guildId },
      {
        statsCategory: data.categoryId,
        statsMemberChannel: data.memberChannelId,
        statsHumanChannel: data.humanChannelId,
        statsBotChannel: data.botChannelId
      },
      { upsert: true, new: true }
    );
  },

  getStatsConfig: async (guildId) => {
    const config = await GuildConfig.findOne({ guildId });
    if (!config || !config.statsMemberChannel) return null;
    return {
      categoryId: config.statsCategory,
      memberChannelId: config.statsMemberChannel,
      humanChannelId: config.statsHumanChannel,
      botChannelId: config.statsBotChannel
    };
  }
};
