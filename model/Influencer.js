const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const influencerSchema = new Schema({
  websiteLink: String,
  youtubeLink: String,
  facebookLink: String,
  twiterLink: String,
  snapchatLink: String,
  walletAddress: String,
  influencerName: String,
  profileImage: Object,
  coverImage: Object,
  isDeleted: { type: Boolean, default: false },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'NftUser',
  },
});

module.exports = mongoose.model('Influencer', influencerSchema);
