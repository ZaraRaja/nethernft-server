const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Launchpage = new Schema({
  tokenname: String,
  amounttoken: String,
  tokenforcounter: String,
  tokenfornether: String,
  tokenforyou: String,
  tokenpool: String,
  tokenstaking: String,
  tokenlaunchpad: String,
  launchcover: String,
  nftname: String,
  description: String,
  isDeleted: { type: Boolean, default: false },
});

module.exports = mongoose.model('Launchpad', Launchpage);
