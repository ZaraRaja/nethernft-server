const { recoverPersonalSignature } = require('@metamask/eth-sig-util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catch_async');
const getNonce = require('../utils/get_nonce');
const web3 = require('../config/web3');
const responseMessages = require('../config/response_messages');
const User = require('../model/User');
const Crud = require('../services/Crud');
const userRoles = require('../config/user_roles');

function signToken(account_address) {
  return jwt.sign({ account_address }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN_DAYS + 'd',
  });
}

function createSendToken(user, statusCode, req, res, options = {}) {
  const token = signToken(user.account_address);

  const sendObj = {
    status: 'success',
    message: responseMessages.LOGGED_IN,
    message: 'Logged in successfully!',
    token,
  };

  // Only send user when its needed
  if (options.sendUser === true) {
    sendObj.user = user;
  }

  // Set Cookies Options
  const cookieOptions = {
    httpOnly: true, // So that Cookie can not be accessed or modified by the client/browser
    expires: new Date(
      Date.now() + Number(process.env.JWT_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000
    ),
    secure: req.secure || req.headers['x-forwarded-proto'] === true,
  };

  // Send Cookies
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json(sendObj);
}

/**
 * POST
 * Register a User
 */

exports.signup = catchAsync(async (req, res, next) => {
  if (req.user) {
    return next(
      new AppError(
        responseMessages.ALREADY_LOGGED_IN,
        'You are already logged in!',
        403
      )
    );
  }

  const { account_address, username, email, avatar } = req.body;

  if (!account_address || !username || !email || !avatar) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'Account account_address, Username, Email, and Avatar are required fields!',
        400
      )
    );
  }

  if (!web3.utils.isAddress(account_address)) {
    return next(
      new AppError(
        responseMessages.INVALID_ACCOUNT_ADDRESS,
        'Account Address is invalid!',
        400
      )
    );
  }

  const new_user = new User({
    account_address: web3.utils.toChecksumAddress(account_address),
    username,
    email,
    avatar,
    nonce: await getNonce(),
  });

  const saved_user = await new_user.save();

  res.status(200).json({
    status: 'success',
    message: responseMessages.SIGNUP_SUCCESS,
    message_description: 'User signup is successful!',
    user: saved_user,
  });
});

/**
 * Get
 * Get Nonce By Address
 */

exports.getNonce = catchAsync(async (req, res, next) => {
  if (req.user) {
    return next(
      new AppError(
        responseMessages.ALREADY_LOGGED_IN,
        'You are already logged in!',
        403
      )
    );
  }

  const { account_address } = req.params;

  if (!account_address) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_PARAMS,
        'Account Address is required in parameter!',
        400
      )
    );
  }

  if (!web3.utils.isAddress(account_address)) {
    return next(
      new AppError(
        responseMessages.INVALID_ACCOUNT_ADDRESS,
        'Account Address is invalid!',
        400
      )
    );
  }

  const user = await Crud.getOne(User, {
    account_address: web3.utils.toChecksumAddress(account_address),
  });

  if (!user) {
    return next(
      new AppError(responseMessages.USER_NOT_FOUND, 'User does not exist!', 404)
    );
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.NONCE_RECIEVED,
    message_description: `Nonce for ${account_address}`,
    nonce: user.nonce,
  });
});

/**
 * POST
 * Login a User
 */

exports.login = catchAsync(async (req, res, next) => {
  if (req.user) {
    return next(
      new AppError(
        responseMessages.ALREADY_LOGGED_IN,
        'You are already logged in!',
        403
      )
    );
  }

  const { account_address, data, signature } = req.body;

  if (!account_address || !data || !signature) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'Account Address, Data and Signature are required!',
        400
      )
    );
  }

  if (!web3.utils.isAddress(account_address)) {
    return next(
      new AppError(
        responseMessages.INVALID_ACCOUNT_ADDRESS,
        'Account Address is invalid!',
        400
      )
    );
  }

  const user = await User.findOne({
    account_address: web3.utils.toChecksumAddress(account_address),
  }).populate(userRoles.INFLUENCER);

  if (!user) {
    return next(
      new AppError(responseMessages.USER_NOT_FOUND, 'User does not exist!', 404)
    );
  }

  const nonce = web3.utils.hexToUtf8(data).split(': ')[1];

  if (user.nonce !== nonce) {
    return next(
      new AppError(responseMessages.INCORRECT_NONCE, 'Nonce is incorrect!', 403)
    );
  }

  const recovered_address = recoverPersonalSignature({ data, signature });

  if (
    web3.utils.toChecksumAddress(recovered_address) !==
    web3.utils.toChecksumAddress(user.account_address)
  ) {
    return next(
      new AppError(
        responseMessages.INCORRECT_CREDENTIALS,
        'Incorrect Credentials!',
        403
      )
    );
  }

  user.nonce = await getNonce();

  const saved_user = await user.save();

  createSendToken(saved_user, 200, req, res, { sendUser: true });
});
