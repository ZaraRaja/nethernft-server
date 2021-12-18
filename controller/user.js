const User = require('../model/User');
const catchAsync = require('../utils/catch_async');
const Crud = require('../services/Crud');
const response_messages = require('../config/response_messages');

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
  const user = await Crud.getOne(User, {
    account_address: req.params.address,
  });

  if (!user) {
    return next(
      new AppError(
        response_messages.USER_NOT_FOUND,
        'User does not exist!',
        404
      )
    );
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `User with Address: ${req.params.address}`,
    user,
  });
});
