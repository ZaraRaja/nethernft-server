const mongoose = require('mongoose');
const dbCollections = require('../config/db_collections');
const web3 = require('../config/web3');

const bidSchema = new mongoose.Schema(
  {
    bidder: {
      type: String,
      trim: true,
      set: (val) => {
        return web3.utils.toChecksumAddress(val);
      },
    },
    auction_by: {
      type: String,
      trim: true,
      set: (val) => {
        return web3.utils.toChecksumAddress(val);
      },
    },
    fee_paid_in_bnb: {
      type: Number,
      required: [true, 'Please provide amount of BNB paid for this bid!'],
    },
    trx_hash_bnb: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, 'Please provide transaction hash of BNB for this bid!'],
    },
    nft: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: dbCollections.NFT.model,
      required: [true, 'Please provide NFT id for the bid!'],
    },
    bid_price_ntr: {
      type: Number,
      required: [true, 'Please provide bid price in NTR paid for this bid!'],
    },
    bid_status: {
      type: String,
      trim: true,
      lowercase: true,
      enum: ['current', 'previous'],
    },
    trx_hashes_ntr: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
        },
      ],
    },
  },
  { timestamps: true }
);

const Bid = mongoose.model(dbCollections.BID.model, bidSchema);

module.exports = Bid;
