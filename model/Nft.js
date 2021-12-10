const mongoose = require('mongoose');
const nftSchema = new mongoose.Schema(
  {
    cid: String,
    img: String,
    nameTitle: String,
    owner: String,
    title: String,
    username: String,
    price: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

const Nft = mongoose.model('Nft', nftSchema);

module.exports = Nft;
