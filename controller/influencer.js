const Influencer = require('../model/Influencer');

/**
 * POST
 * Adding an Influncer
 */
exports.becomeInfluencer = async (req, res, next) => {
  console.log('Influencer', req.body);
  try {
    const oldInfluencer = await Influencer.findOne({
      wallet_address: req.body.wallet_address,
    });

    if (oldInfluencer) {
      if (oldInfluencer.isApproved) {
        return res.status(403).json({
          status: 'fail',
          message: 'You are already an Influencer!',
        });
      } else {
        return res.status(403).json({
          status: 'fail',
          message: 'You have a pending request to become Influencer!',
        });
      }
    }

    const new_influencer = new Influencer(req.body);
    const saved_influencer = await new_influencer.save();

    res.status(200).json({
      status: 'success',
      data: saved_influencer,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: 'error',
      error: err,
    });
  }
};

/**
 * GET
 * Fetching Influncer based on Address
 */

exports.getInfluencerBasedOnAddress = async (req, res, next) => {
  try {
    const influencer = await Influencer.findOne({
      wallet_address: req.params.address,
    });

    if (!influencer) {
      return res.status(404).json({
        status: 'fail',
        message: `The address doesn't belong to Influencer!`,
      });
    }

    res.status(200).json({
      status: 'success',
      influencer: influencer,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: 'error',
      error: err,
    });
  }
};

/**
 * POST
 * Uploading Influencer Images
 */

exports.uploadInflencerImages = async (req, res, next) => {
  try {
    console.log(req.body);
    console.log(req.files['profileImage'][0]);
    console.log(req.files['coverImage'][0]);
    res.status(200).send({
      profile_image: req.files['profileImage'][0].path,
      cover_image: req.files['coverImage'][0].path,
    });
  } catch (err) {
    console.log(err);
  }
};
