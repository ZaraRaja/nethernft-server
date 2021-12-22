const Crud = require('../services/Crud');
const NFT = require('../model/Nft');
const INFLUENCER = require('../model/Influencer')
const responseMessages = require('../config/response_messages');
const catchAsync = require('../utils/catch_async');
const AppError = require('../utils/AppError');

/**
 * POST
 * Minting a New NFT
 */

exports.mint = catchAsync(async (req, res, next) => {
  // TODO: Validate req.body
  const new_nft = new NFT({
    ...req.body,
  });
  const saved_nft = await new_nft.save();
  res.status(200).json({
    status: 'success',
    message: responseMessages.NFT_MINTED,
    message: 'NFT minted successfully!',
    nft: saved_nft,
  });
});

/**
 * PATCH
 * Updating Price of Minted NFT
 */

exports.updatePrice = catchAsync(async (req, res, next) => {
  let { price } = req.body;

  if (!price) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'Price is required!',
        400
      )
    );
  }

  price = Number(price);

  if (isNaN(price)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE_TYPE,
        'Price should be a number!',
        400
      )
    );
  }

  const nft = await Crud.getOne(NFT, { _id: req.params.id });

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  nft.price = price;

  const updated_nft = await nft.save();

  res.status(200).json({
    status: 'success',
    message: responseMessages.NFT_PRICE_UPDATED,
    message_description: 'NFT price updated successfully!',
    nft: updated_nft,
  });
});

/**
 * Get
 * Getting the Price of Display.
 */

exports.getPrice = catchAsync(async (req, res, next) => {
  const nft = await Crud.getOne(NFT, { _id: req.params.id });

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `NFT with ID: ${req.params.id}`,
    nft,
  });
});

/**
 * Get
 * Getting All Nfts
 */

exports.getAllNFTs = catchAsync(async (req, res, next) => {
  const nfts = await Crud.getList(NFT, {});
  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'All NFTs',
    nfts,
  });
});

/**
 * Get
 * Getting One Nfts
 */

exports.getOneNft = catchAsync(async (req, res, next) => {
  const nft = await Crud.getOne(NFT, { _id: req.params.id }, {});
  const user = await Crud.getOne(INFLUENCER,{account_address:nft.owner});
  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'NFT Data',
    nft,user
  });
});

 
/**
 * PATCH
 * Transfering Ownership of an NFT
 */

exports.transferOwnership = catchAsync(async (req, res, next) => {
  const { file_hash, owner, buyer } = req.body;

  if (!file_hash || !owner || !buyer) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'file_hash, owner and buyer fields are required',
        400
      )
    );
  }

  const nft = await NFT.findOne({ file_hash, owner });

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  nft.owner = buyer;

  const saved_nft = await nft.save();
console.log("Saved nft". saved_nft)
  res.status(200).json({
    status: 'success',
    message: responseMessages.NFT_OWNERSHIP_TRANSFERRED,
    message_description: 'NFT ownership transferred!',
    nft: saved_nft,
  });
});
