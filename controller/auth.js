const catchAsync = require('../utils/catch_async');

/**
 * POST
 * Register a User
 */

exports.signup = catchAsync(async (req, res, next) => {
  // TODO: User signup

  res.status(200).json({
    message: 'Route in development',
  });
});

/**
 * POST
 * Login a User
 */

exports.login = catchAsync(async (req, res, next) => {
  // TODO: User login

  res.status(200).json({
    message: 'Route in development',
  });
});
