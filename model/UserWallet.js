const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const NftUserWallet = mongoose.Schema({
  connectedAccount: { type: 'string', required: true },
});

module.exports = mongoose.model('NftUserWallet', NftUserWallet);
