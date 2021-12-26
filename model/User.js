const mongoose = require('mongoose');
const dbCollections = require('../config/db_collections');
const userRoles = require('../config/user_roles');
const { ObjectId } = mongoose.Schema.Types;

const User = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  account_address: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  profile_image: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  nonce: {
    type: String,
    required: true,
    trim: true,
  },
  roles: {
    type: [String],
    enum: [
      userRoles.USER,
      userRoles.INFLUENCER,
      userRoles.PENDING_INFLUENCER,
      userRoles.ADMIN,
    ],
    default: [userRoles.USER],
  },
  [userRoles.INFLUENCER]: {
    type: ObjectId,
    ref: dbCollections.INFLUENCER.model,
  },
});

module.exports = mongoose.model(dbCollections.USER.model, User);
