const mongoose = require('mongoose');
const dbCollections = require('../config/db_collections');
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema.Types;

const influencerSchema = new Schema(
  {
    account_address: {
      type: String,
      unique: true,
      required: [true, 'Account address is required!'],
    },
    short_bio: {
      type: String,
      trim: true,
      required: [true, 'Short Bio is Required!'],
    },
    field: {
      type: String,
      trim: true,
      required: [true, 'Field is Required!'],
    },
    cover_image: {
      type: String,
      trim: true,
      required: [true, 'Cover Image is Required!'],
    },
    website_url: {
      type: String,
      trim: true,
    },
    youtube_channel_url: {
      type: String,
      trim: true,
    },
    facebook_username: {
      type: String,
      trim: true,
    },
    twitch_username: {
      type: String,
      trim: true,
    },
    snapchat_username: {
      type: String,
      trim: true,
    },
    instagram_username: {
      type: String,
      trim: true,
    },
    // twitter_username: {
    //   type: String,
    //   trim: true,
    // },
    // instagram_username: {
    //   type: String,
    //   trim: true,
    // },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      lowercase: true,
      required: true,
    },
  },
  {
    toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true }, // So `console.log()` and other functions that use `toObject()` include virtuals
  }
);

// For getting all NFTs by an Influencer
influencerSchema.virtual('nfts', {
  ref: dbCollections.NFT.model,
  localField: 'account_address',
  foreignField: 'owner',
});

influencerSchema.virtual('user', {
  ref: dbCollections.USER.model,
  localField: 'account_address',
  foreignField: 'account_address',
});

module.exports = mongoose.model(
  dbCollections.INFLUENCER.model,
  influencerSchema
);
