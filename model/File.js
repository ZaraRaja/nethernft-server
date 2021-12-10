const mongoose = require('mongoose');

const filename = mongoose.Schema({
  filepath: { type: String },
  hash: { type: String },
});

module.exports = mongoose.model('filepath', filename);
