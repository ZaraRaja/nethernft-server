const response_messages = require('../config/response_messages');
const Influencer = require('../model/Influencer');
const Crud = require('../services/Crud');
const catchAsync = require('../utils/catch_async');

/**
 * POST
 * Adding an Influncer
 */
exports.becomeInfluencer = catchAsync(async (req, res, next) => {
  const { account_address } = req.body;

  if (!account_address) {
    return next(
      new AppError(
        response_messages.MISSING_REQUIRED_FIELDS,
        'account_address field is required!',
        400
      )
    );
  }

  const oldInfluencer = await Crud.getOne(Influencer, {
    account_address,
  });

  if (oldInfluencer) {
    if (oldInfluencer.isApproved) {
      return next(
        new AppError(
          response_messages.ALREADY_INFLUENCER,
          'You are already an Influencer!',
          403
        )
      );
    } else {
      return next(
        new AppError(
          response_messages.INFLUENCER_REQUEST_PENDING,
          'You have a pending request to become Influencer!',
          403
        )
      );
    }
  }

  // TODO: validate req.body, don't trust client side
  const new_influencer = new Influencer({
    ...req.body,
    isDeleted: false,
    isApproved: false,
  });

  const saved_influencer = await new_influencer.save();

  // TODO: save the reference of saved_influencer in corresponding user document

  res.status(200).json({
    status: 'success',
    message: responseMessages.INFLUENCER_CREATED,
    message_description: 'Your request is submitted to become an Influencer!',
    influencer: saved_influencer,
  });
});

/**
 * GET
 * Fetching Influncer based on Address
 */

exports.getInfluencerByAddress = catchAsync(async (req, res, next) => {
  const influencer = await Crud.getOne(Influencer, {
    account_address: req.params.address,
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
 * POST
 * Uploading Influencer Images
 */

exports.uploadInflencerImages = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: responseMessages.IMAGES_UPLOADED,
    message_description: `Influencer images uploaded successfully!`,
    images: {
      profile_image: req.files['profile_image'][0].path,
      cover_image: req.files['cover_image'][0].path,
    },
  });
});

/**
 * POST
 * Admin approve Influncer
 */

exports.approveInfluencer = catchAsync(async (req, res, next) => {
  const influencer = await Crud.getOne(Influencer, {
    account_address: req.params.address,
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

  if (influencer.isApproved) {
    return next(
      new AppError(
        responseMessages.INFLUENCER_ALREADY_APPROVED,
        'Influencer account is already approved!',
        403
      )
    );
  }

  influencer.isApproved = true;

  const saved_influencer = await influencer.save();

  res.status(200).json({
    status: 'success',
    message: responseMessages.INFLUENCER_APPROVED,
    message_description: `Influencer is approved successfully!`,
    influencer: saved_influencer,
  });
});
