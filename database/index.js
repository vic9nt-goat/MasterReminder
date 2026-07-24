const mongoose = require('mongoose');
const { mongoUri } = require('../config.json');
const GuildConfig = require('../models/GuildConfig');
const Reminder = require('../models/Reminder');

mongoose.connect(mongoUri)
  .then(() => console.log('🍃 Conectado exitosamente a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

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
  }
};