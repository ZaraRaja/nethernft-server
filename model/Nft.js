const mongoose = require('mongoose');
const dbCollections = require('../config/db_collections');

const nftSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    token_name: String,
    token_amount: Number,
    token_sold: {
      type: Number,
      default: 0,
    },
    price: Number,
    file_hash: String,
    file_format: String,
    owner: String,
    metadata_hash: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

const NFT = mongoose.model(dbCollections.NFT.model, nftSchema);

module.exports = NFT;
