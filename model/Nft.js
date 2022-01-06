const mongoose = require('mongoose');
const dbCollections = require('../config/db_collections');
const nftStatuses = require('../config/nft_statuses');
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
      trim: true,
      uppercase: true, // should be unique
    },
    token_amount: {
      type: Number,
      min: 1,
      max: 1,
      default: 1,
    },
    price_in_ntr: {
      type: Number,
      min: 0.1,
    },
    metadata_hash: {
      type: String,
      trim: true, // should be unique
    },
    file_hash: {
      type: String,
      trim: true, // should be unique
    },
    file_format: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      enum: [nftStatuses.FOR_SALE, nftStatuses.NOT_FOR_SALE],
      required: [true, 'Please provide NFT status!'],
    },
    category: {
      type: String,
      trim: true,
      enum: [
        'music',
        'arts',
        'collectibles',
        'photography',
        'sports',
        'trading cards',
        'utilities',
        'virtual worlds',
        'science',
        'religion',
        'others',
      ],
      lowercase: true,
    },
    owner: {
      type: String,
      trim: true,
      set: (val) => {
        return web3.utils.toChecksumAddress(val);
      },
    },
    mint_trx_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: dbCollections.TRANSACTION.model,
      required: [true, 'Please provide mint transaction id of NFT!'],
      unique: true,
    },
    transfer_trx_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: dbCollections.TRANSACTION.model,
    },
    listing_trx_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: dbCollections.TRANSACTION.model,
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

nftSchema.virtual('user', {
  ref: dbCollections.USER.model,
  localField: 'owner',
  foreignField: 'account_address',
});

const NFT = mongoose.model(dbCollections.NFT.model, nftSchema);

module.exports = NFT;
