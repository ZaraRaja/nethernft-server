const responseMessages = require('../config/response_messages');
const User = require('../model/User');
const Influencer = require('../model/Influencer');
const userRoles = require('../config/user_roles');
const Crud = require('../services/Crud');
const catchAsync = require('../utils/catch_async');
const AppError = require('../utils/AppError');
const web3 = require('../config/web3');
const Transaction = require('../model/Transaction');
const Following = require('../model/Following');
const nftStatuses = require('../config/nft_statuses');

/**
 * POST
 * Adding an Influncer
 */
exports.becomeInfluencer = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    profile_image,
    short_bio,
    field,
    cover_image,
    website_url,
    youtube_channel_url,
    facebook_username,
    twitch_username,
    snapchat_username,
    twitter_username,
    instagram_username,
  } = req.body;

  if (
    !name?.trim() ||
    !email?.trim() ||
    !profile_image?.trim() ||
    !short_bio?.trim() ||
    !cover_image?.trim() ||
    !field?.trim()
  ) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'name, email, profile_image, cover_image, short_bio, and field are required!',
        400
      )
    );
  }

  if (req.user.roles.includes(userRoles.INFLUENCER)) {
    if (req.user[userRoles.INFLUENCER].status === 'approved') {
      return next(
        new AppError(
          responseMessages.ALREADY_INFLUENCER,
          'You are already an Influencer!',
          403
        )
      );
    } else if (req.user[userRoles.INFLUENCER].status === 'rejected') {
      return next(
        new AppError(
          responseMessages.INFLUENCER_REQUEST_REJECTED,
          'Your request to become Influencer is rejected!',
          403
        )
      );
    } else {
      return next(
        new AppError(
          responseMessages.INFLUENCER_REQUEST_PENDING,
          'You have a pending request to become Influencer!',
          403
        )
      );
    }
  }

  const new_influencer = new Influencer({
    account_address: web3.utils.toChecksumAddress(req.user.account_address),
    short_bio,
    field,
    cover_image,
    website_url,
    youtube_channel_url,
    facebook_username,
    twitch_username,
    snapchat_username,
    twitter_username,
    instagram_username,
  });

  const saved_influencer = await new_influencer.save();

  // save the reference of saved_influencer in corresponding user document
  req.user.name = name;
  req.user.email = email;
  req.user.profile_image = profile_image;
  req.user.roles.push(userRoles.PENDING_INFLUENCER);
  req.user[userRoles.INFLUENCER] = saved_influencer;

  let saved_user;

  try {
    saved_user = await req.user.save();
  } catch (error) {
    await saved_influencer.remove();
    return next(error);
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.INFLUENCER_CREATED,
    message_description: 'Your request is submitted to become an Influencer!',
    user: saved_user,
  });
});

/**
 * GET
 * Fetching Influncer based on Address
 */

exports.getInfluencerByAddress = catchAsync(async (req, res, next) => {
  const influencer = await Influencer.findOne({
    account_address: web3.utils.toChecksumAddress(req.params.address),
  });

  if (!influencer) {
    return next(
      new AppError(
        responseMessages.INFLUENCER_NOT_FOUND,
        'Influencer does not exist!',
        404
      )
    );
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `Influencer with Address: ${req.params.address}`,
    influencer,
  });
});

/**
 * GET
 * Get Influencer Details Along with his deployed NFTs
 */

exports.getInfluencerWithNfts = catchAsync(async (req, res, next) => {
  const influencer = await Influencer.findOne({
    account_address: web3.utils.toChecksumAddress(req.params.address),
    status: nftStatuses.FOR_SALE,
  }).populate('nfts');

  if (!influencer) {
    return next(
      new AppError(
        responseMessages.INFLUENCER_NOT_FOUND,
        'Influencer does not exist!',
        404
      )
    );
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `Influencer with Address: ${req.params.address}`,
    influencer,
  });
});

/**
 * POST
 * Uploading Influencer Images
 */

exports.uploadInflencerImages = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: responseMessages.IMAGES_UPLOADED,
    message_description: `Influencer images uploaded successfully!`,
    images: {
      cover_image: req.files['cover_image'][0].path,
    },
  });
});

/**
 * POST
 * Admin approve Influncer
 */

exports.updateStatus = catchAsync(async (req, res, next) => {
  const influencer = await Influencer.findOne({
    account_address: web3.utils.toChecksumAddress(req.params.address),
  });

  if (!influencer) {
    return next(
      new AppError(
        responseMessages.INFLUENCER_NOT_FOUND,
        'Influencer does not exist!',
        404
      )
    );
  }

  if (influencer.status === 'approved') {
    return next(
      new AppError(
        responseMessages.INFLUENCER_ALREADY_APPROVED,
        'Influencer account is already approved!',
        403
      )
    );
  }

  if (influencer.status === 'rejected') {
    return next(
      new AppError(
        responseMessages.INFLUENCER_ALREADY_REJECTED,
        'Influencer account is already rejected!',
        403
      )
    );
  }

  const user = await User.findOne({
    account_address: web3.utils.toChecksumAddress(influencer.account_address),
  });

  if (!user) {
    return next(
      new AppError(responseMessages.USER_NOT_FOUND, 'User does not exist!', 404)
    );
  }

  // Remove pending influencer from User
  for (let i = 0; i <= user.roles.length; i++) {
    if (user.roles[i] === userRoles.PENDING_INFLUENCER) {
      user.roles.splice(i, 1);
    }
  }

  if (req.body.status === 'approved') {
    user.roles.push(userRoles.INFLUENCER);
  }
  influencer.status = req.body.status;

  await user.save();
  const saved_influencer = await influencer.save();

  res.status(200).json({
    status: 'success',
    message:
      influencer.status === 'approved'
        ? responseMessages.INFLUENCER_APPROVED
        : responseMessages.INFLUENCER_REJECTED,
    message_description: `Influencer is ${influencer.status} successfully!`,
    influencer: saved_influencer,
  });
});

/**
 * GET
 * Get all Influncer details
 */
exports.getAllInfluencers = catchAsync(async (req, res, next) => {
  const influencers = await Crud.getList(Influencer, {});

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'All Influencers',
    influencers,
  });
});

/**
 * GET
 * Get Top Influncer details
 */
exports.getTopInfluencers = catchAsync(async (req, res, next) => {
  const influencers = await Transaction.aggregate([
    {
      $match: {
        trx_type: 'transfer',
      },
    },
    {
      $group: {
        _id: '$seller',
        sale_amount: {
          $sum: '$price_in_ntr',
        },
        number_of_sales: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        sale_amount: -1,
        number_of_sales: -1,
      },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: Influencer.collection.name,
        localField: '_id',
        foreignField: 'account_address',
        as: 'influencer',
      },
    },
    {
      $unwind: '$influencer',
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: 'influencer.account_address',
        foreignField: 'account_address',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        _id: 0,
        sale_amount: 1,
        account_address: '$_id',
        username: '$user.username',
        name: '$user.name',
        profile_image: '$user.profile_image',
        field: '$influencer.field',
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'Top Influencers',
    influencers,
  });
});

/**
 * Get
 * Getting Pending Influencers
 */

exports.getPendingInfluencers = catchAsync(async (req, res, next) => {
  const pendingInfluencers = await User.find({
    roles: userRoles.PENDING_INFLUENCER,
  }).populate('influencer');

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'Pending Influencers Data',
    users: pendingInfluencers,
  });
});

/**
 * Patch
 * Follow or unfollow
 */
exports.follow = catchAsync(async (req, res, next) => {
  const { command } = req.body;
  if (!command) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'command field is required!',
        400
      )
    );
  }

  if (command !== 'follow' && command !== 'unfollow') {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE,
        'Invalid value for command!',
        400
      )
    );
  }

  if (req.user.roles.includes(userRoles.INFLUENCER)) {
    return next(
      new AppError(
        responseMessages.INFLUENCER_CANNOT_FOLLOW,
        'Influencer cannot Follow anyone!',
        400
      )
    );
  }

  const influencer = await Influencer.findOne({
    account_address: web3.utils.toChecksumAddress(req.params.address),
  });

  if (!influencer) {
    return next(
      new AppError(
        responseMessages.INFLUENCER_NOT_FOUND,
        'Influencer does not exist!',
        404
      )
    );
  }

  // Check if the follower and influencer is same
  if (
    web3.utils.toChecksumAddress(req.user.account_address) ===
    web3.utils.toChecksumAddress(req.params.address)
  ) {
    return next(
      new AppError(
        responseMessages.FOLLOW_SELF_NOT_ALLOWED,
        'You cannot follow yourself!',
        403
      )
    );
  }

  // Check if the follow document exist for current follower and Influencer, if true then error
  const followExist = await Following.findOne({
    follower_address: web3.utils.toChecksumAddress(req.user.account_address),
    influencer_address: web3.utils.toChecksumAddress(req.params.address),
  });

  if (command == 'follow' && followExist) {
    return next(
      new AppError(
        responseMessages.ALREADY_FOLLOWED,
        'You have already followed the Influncer!',
        403
      )
    );
  }

  if (command == 'unfollow' && !followExist) {
    return next(
      new AppError(
        responseMessages.NOT_FOLLOWED,
        'You have not followed the Influncer!',
        403
      )
    );
  }

  let new_doc;

  if (command == 'follow') {
    new_doc = new Following({
      follower_address: web3.utils.toChecksumAddress(req.user.account_address),
      influencer_address: web3.utils.toChecksumAddress(req.params.address),
    });
    await new_doc.save();
  } else {
    await followExist.remove();
  }

  res.status(200).json({
    status: 'success',
    message:
      command === 'follow'
        ? responseMessages.FOLLOW_SUCCESS
        : responseMessages.UNFOLLOW_SUCCESS,
    message_description:
      command === 'follow'
        ? 'Successfully Followed!'
        : 'Successfully Unfollowed!',
  });
});

/**
 * Get
 * Getting Followers of Influencer By Address
 */
exports.getFollowersByAddress = catchAsync(async (req, res, next) => {
  const followers = await Following.aggregate([
    {
      $match: {
        influencer_address: web3.utils.toChecksumAddress(req.params.address),
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: 'follower_address',
        foreignField: 'account_address',
        as: 'follower',
      },
    },
    {
      $unwind: '$follower',
    },
    {
      $project: {
        _id: 0,
        username: '$follower.username',
        name: '$follower.username',
        profile_image: '$follower.profile_image',
        account_address: '$follower.account_address',
        roles: '$follower.roles',
        createdAt: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'All Followers',
    followers,
  });
});
