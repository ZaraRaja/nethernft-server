const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const NftUser = mongoose.Schema({
  username: { type: 'string', required: true },
  email: { type: 'string', required: true },
  password: { type: 'string', required: true },
  roles: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User',
  },
  followers: [{ type: ObjectId, ref: 'User' }],
  following: [{ type: ObjectId, ref: 'User' }],
  isInfluencer: {
    type: Boolean,
    default: false,
  },
  isRequested: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('NftUser', NftUser);
