const mongoose = require('mongoose');
const dbCollections = require('../config/db_collections');

const transactionSchema = new mongoose.Schema(
  {
    buyer: String,
    seller: String,
    token_price: Number,
    token_amount: Number,
    nft: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: dbCollections.NFT.model,
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model(
  dbCollections.TRANSACTION.model,
  transactionSchema
);

module.exports = Transaction;
