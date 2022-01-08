const User = require('../model/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catch_async');
const Crud = require('../services/Crud');
const responseMessages = require('../config/response_messages');
const userRoles = require('../config/user_roles');
const web3 = require('../config/web3');
const Following = require('../model/Following');
const Influencer = require('../model/Influencer');
const NFT = require('../model/Nft');
const nftStatuses = require('../config/nft_statuses');

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
  const {
    profile_image,
    first_name,
    last_name,
    email,
    username,
    field,
    short_bio,
    website_url,
    cover_image,
  } = req.body;

  if (profile_image?.trim()) {
    req.user.profile_image = profile_image?.trim();
  }

  if (first_name?.trim()) {
    req.user.first_name = first_name?.trim();
  }

  if (first_name?.trim()) {
    req.user.last_name = last_name?.trim();
  }

  if (email?.trim()) {
    req.user.email = email?.trim();
  }

  if (username?.trim()) {
    req.user.username = username?.trim();
  }

  if (req.user?.influencer && field?.trim()) {
    req.user.influencer.field = field?.trim();
  }

  if (req.user?.influencer && short_bio?.trim()) {
    req.user.influencer.short_bio = short_bio?.trim();
  }

  // Optional Fields
  if (req.user?.influencer && website_url !== undefined) {
    req.user.influencer.website_url = website_url?.trim();
  }

  if (req.user?.influencer && cover_image !== undefined) {
    req.user.influencer.cover_image = cover_image?.trim();
  }

  await req.user.save();
  await req.user?.influencer?.save();

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'User Updated Successfully!',
    user: req.user,
  });
});

/**
 * Get
 * Getting Following of User By Address
 */
exports.getFollowingByAddress = catchAsync(async (req, res, next) => {
  const following = await Following.aggregate([
    {
      $match: {
        follower_address: web3.utils.toChecksumAddress(
          req.params.account_address
        ),
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: 'influencer_address',
        foreignField: 'account_address',
        as: 'user',
      },
    },
    {
      $lookup: {
        from: Influencer.collection.name,
        localField: 'influencer_address',
        foreignField: 'account_address',
        as: 'influencer',
      },
    },
    {
      $lookup: {
        from: NFT.collection.name,
        as: 'nfts',
        let: { owner: '$influencer_address' },

        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$owner', '$$owner'] },
                  { $eq: ['$status', nftStatuses.FOR_SALE] },
                ],
              },
            },
          },
          { $sort: { createdAt: 1 } },
          { $limit: 3 },
        ],
      },
    },
    {
      $unwind: '$user',
    },
    {
      $unwind: '$influencer',
    },
    {
      $project: {
        _id: 0,
        user: 1,
        in_user: {
          influencer: '$influencer',
          nfts: '$nfts',
        },
      },
    },
    {
      $project: {
        user: {
          $mergeObjects: ['$user', '$in_user'],
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: '$user',
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'All Following',
    following,
  });
});
