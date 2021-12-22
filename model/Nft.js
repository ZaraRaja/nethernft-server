const mongoose = require('mongoose');
const dbCollections = require('../config/db_collections');
const web3 = require('../config/web3');

const nftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    token_name: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    token_amount: {
      type: Number,
      min: 1,
    },
    token_sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      min: 0.1,
    },
    file_hash: {
      type: String,
      trim: true,
      unique: true,
    },
    file_format: {
      type: String,
      trim: true,
    },
    metadata_hash: {
      type: String,
      trim: true,
      unique: true,
    },
    owner: {
      type: String,
      trim: true,
      set: (val) => {
        return web3.utils.toChecksumAddress(val);
      },
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true }, // So `console.log()` and other functions that use `toObject()` include virtuals
  }
);

nftSchema.virtual('influencer', {
  ref: dbCollections.INFLUENCER.model,
  localField: 'owner',
  foreignField: 'account_address',
});

const NFT = mongoose.model(dbCollections.NFT.model, nftSchema);

module.exports = NFT;
