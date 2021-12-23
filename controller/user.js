const User = require('../model/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catch_async');
const Crud = require('../services/Crud');
const responseMessages = require('../config/response_messages');
const userRoles = require('../config/user_roles');
const web3 = require('../config/web3');

/**
 * GET
 * Get All User
 */

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await Crud.getList(User, {});

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'All Users',
    users,
  });
});

/**
 * GET
 * Get User By Address
 */

exports.getUserByAddress = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    account_address: web3.utils.toChecksumAddress(req.params.account_address),
  }).populate(userRoles.INFLUENCER);

  if (!user) {
    return next(
      new AppError(responseMessages.USER_NOT_FOUND, 'User does not exist!', 404)
    );
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `User with Address: ${req.params.account_address}`,
    user,
  });
});

/**
 * GET
 * Get Me: Logged In User
 */

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `Logged in User: ${req.params.account_address}`,
    user: req.user,
  });
});

/*
 * PATCH
 * Update the user Description and avatar
 */

exports.updateUser = catchAsync(async (req, res, next) => {
  const { profile_image, name, email, username } = req.body;

  if (profile_image?.trim()) {
    req.user.profile_image = profile_image.trim();
  }

  if (name?.trim()) {
    req.user.name = name.trim();
  }

  if (email?.trim()) {
    req.user.email = email.trim();
  }

  if (username?.trim()) {
    req.user.username = username.trim();
  }

  await req.user.save();

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'User Updated Successfully!',
    user: req.user,
  });
});
