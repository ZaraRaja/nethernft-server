const mongoose = require('mongoose');
const dbCollections = require('../config/db_collections');
const Schema = mongoose.Schema;

const influencerSchema = new Schema(
  {
    website_url: String,
    youtube_channel_url: String,
    facebook_username: String,
    twitch_username: String,
    snapchat_username: String,
    twitter_username: String,
    instagram_username: String,
    // TODO: remove it from here
    account_address: {
      type: String,
      unique: true,
      required: true,
    },
    name: String,
    email: String,
    short_bio: String,
    field: String,
    profile_image: Object,
    cover_image: Object,
    isDeleted: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
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

module.exports = mongoose.model(
  dbCollections.INFLUENCER.model,
  influencerSchema
);
