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
 * PATCH
 * Update the user Description and avatar
 */
exports.updateUser = catchAsync(async (req, res, next) => {
  const { short_bio, avatar } = req.body;

  if (!short_bio?.trim() || !avatar?.trim()) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'short bio and avatar are required',
        400
      )
    );
  }

  req.user.avatar = avatar;

  if (!req.user.roles.includes(userRoles.INFLUENCER)) {
    return next(
      new AppError(
        responseMessages.INFLUENCER_NOT_FOUND,
        'Influencer does not exist',
        403
      )
    );
  }

  req.user.influencer.short_bio = req.body.short_bio;
  await req.user.save();
  await req.user.influencer.save();
  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'Influcencer Descripition updated',
    user: req.user,
  });
});
