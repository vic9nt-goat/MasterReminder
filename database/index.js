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
  }
};
