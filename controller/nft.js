const _ = require('lodash');
const Joi = require('@hapi/joi');
const services = require('../Services/Crud');
const NFT = require('../model/Nft');
const Influencer = require('../model/Influencer');

/**
 * POST
 * Minting a New NFT
 */

exports.addNft = async (req, res, next) => {
  try {
    const new_nft = new NFT({
      ...req.body,
    });
    const saved_nft = await new_nft.save();
    res.status(200).json(saved_nft);
  } catch (err) {
    console.log(err);
  }
};

/**
 * PUT
 * Setting Price of Minted NFT
 */

exports.setPrice = async (req, res, next) => {
  try {
    console.log('Req.body', req.body);

    const schema = Joi.object().keys({
      price: Joi.string().required(),
    });

    const { error, value } = Joi.validate(req.body, schema, {
      abortEarly: true,
      allowUnknown: true,
    });
    if (!_.isNull(error))
      return res
        .status(400)
        .send({ success: false, message: 'Please try later', error });
    const result = await services.updateOneAndReturn(
      NFT,
      { _id: req.params.id },
      {
        price: value.price,
      },
      {}
    );

    res
      .status(200)
      .send({ success: true, message: 'Successfully Price Set', data: result });
  } catch (e) {
    console.log('Error', e);
  }
};

/**
 * Get
 * Getting the Price of Display.
 */

exports.getPrice = async (req, res, next) => {
  try {
    const result = await services.getOne(NFT, { _id: req.params.id }, {}, {});
    res.send({ success: true, data: result });
  } catch (err) {
    console.log(err);
  }
};

/**
 * Get
 * Getting All Nfts
 */

exports.getAllNFT = async (req, res, next) => {
  try {
    const Nfts = await NFT.find();
    res.status(200).send({ message: 'User get details successfully', Nfts });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

/**
 * PUT
 * Transfering Ownership of an NFT
 */

exports.transferOwnership = async (req, res, next) => {
  try {
    console.log('Req.body', req.body);
    const result = await services.updateOneAndReturn(
      NFT,
      { file_hash: req.body.file_hash, owner: req.body.owner },
      {
        owner: req.body.buyer,
      },
      {}
    );

    res
      .status(200)
      .send({ success: true, message: 'Successfully Price Set', data: result });
  } catch (e) {
    console.log('Error', e);
  }
};
