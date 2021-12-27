const mongoose = require('mongoose');
const dbCollections = require('../config/db_collections');
const nftStatuses = require('../config/nft_statuses');
const web3 = require('../config/web3');

const transactionSchema = new mongoose.Schema(
  {
    trx_type: {
      type: String,
      required: [true, 'Please provide the transaction type.'],
      enum: ['mint', 'transfer', 'listing'],
      lowercase: true,
    },
    fee_paid_in_bnb: {
      type: Number,
      required: [
        true,
        'Please provide amount of BNB paid for this transacion!',
      ],
    },
    trx_hash_bnb: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: [
        true,
        'Please provide transaction hash of BNB for this transacion!',
      ],
    },
    nft: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: dbCollections.NFT.model,
      required: [true, 'Please provide NFT id for the transacion!'],
    },
    buyer: {
      type: String,
      trim: true,
      set: (val) => {
        return web3.utils.toChecksumAddress(val);
      },
    },
    seller: {
      type: String,
      trim: true,
      set: (val) => {
        return web3.utils.toChecksumAddress(val);
      },
    },
    price_in_ntr: Number,
    trx_hash_ntr: {
      type: String,
      trim: true,
      lowercase: true,
    },
    owner: {
      type: String,
      trim: true,
      set: (val) => {
        return web3.utils.toChecksumAddress(val);
      },
    },
    listing_status: {
      type: String,
      enum: [nftStatuses.FOR_SALE, nftStatuses.NOT_FOR_SALE],
      lowercase: true,
    },
    transfer_status: {
      type: String,
      enum: ['pending', 'complete'],
      lowercase: true,
    },
    mint_status: {
      type: String,
      enum: ['pending', 'complete'],
      lowercase: true,
    },
    minted_by: {
      type: String,
      trim: true,
      set: (val) => {
        return web3.utils.toChecksumAddress(val);
      },
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model(
  dbCollections.TRANSACTION.model,
  transactionSchema
);

module.exports = Transaction;
