const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const User = mongoose.Schema({
  username: { type: 'string', required: true },
  account_address: { type: 'string', required: true },
  email: { type: 'string' },
  roles: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  following: [{ type: ObjectId, ref: 'Influencer' }],
  influencer: { type: ObjectId, ref: 'Influencer' },
});

module.exports = mongoose.model('User', User);
