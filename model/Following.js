const mongoose = require('mongoose');
const dbCollections = require('../config/db_collections');
const Schema = mongoose.Schema;

const followingSchema = new Schema(
  {
    follower_address: {
      type: String,
      required: [true, 'Follower Address is required!'],
    },
    influencer_address: {
      type: String,
      required: [true, 'Influencer Address is required!'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true }, // So `console.log()` and other functions that use `toObject()` include virtuals
  }
);

followingSchema.index(
  { follower_address: 1, influencer_address: 1 },
  { unique: true }
);

followingSchema.virtual('follower', {
  ref: dbCollections.USER.model,
  localField: 'follower',
  foreignField: 'account_address',
});

followingSchema.virtual('influencer', {
  ref: dbCollections.INFLUENCER.model,
  localField: 'influencer',
  foreignField: 'account_address',
});

module.exports = mongoose.model(dbCollections.FOLLOWING.model, followingSchema);
