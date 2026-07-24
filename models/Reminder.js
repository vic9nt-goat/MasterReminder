const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: String,
  content: String,
  date: Date
});

module.exports = mongoose.model('Reminder', reminderSchema);
