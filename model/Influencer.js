const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const influencerSchema = new Schema({
  website_url: String,
  youtube_channel_url: String,
  facebook_username: String,
  twitch_username: String,
  snapchat_username: String,
  twitter_username: String,
  instagram_username: String,
  account_address: String,
  name: String,
  email: String,
  short_bio: String,
  field: String,
  profile_image: Object,
  cover_image: Object,
  isDeleted: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
});

module.exports = mongoose.model('Influencer', influencerSchema);
