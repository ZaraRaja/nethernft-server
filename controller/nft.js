const Crud = require('../services/Crud');
const NFT = require('../model/Nft');
const Transaction = require('../model/Transaction');
const responseMessages = require('../config/response_messages');
const catchAsync = require('../utils/catch_async');
const AppError = require('../utils/AppError');
const web3 = require('../config/web3');

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

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'NFT Data',
    nft,
  });
});

/**
 * PATCH
 * Transfering Ownership of an NFT
 */

exports.buy = catchAsync(async (req, res, next) => {
  const { _id, seller, buyer } = req.body;
  let { token_price, purchased_amount } = req.body;

  if (!_id || !seller || !buyer || !purchased_amount || !token_price) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        '_id, seller, buyer, purchases_amount and token_price fields are required',
        400
      )
    );
  }

  if (!web3.utils.isAddress(buyer) || !web3.utils.isAddress(seller)) {
    return next(
      new AppError(
        responseMessages.INVALID_ACCOUNT_ADDRESS,
        'Buyer/Seller Account Address are invalid!',
        400
      )
    );
  }

  token_price = Number(token_price);
  purchased_amount = Number(purchased_amount);

  if (isNaN(token_price) || isNaN(purchased_amount)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE_TYPE,
        'Token Price and Purchased Amount should be a number!',
        400
      )
    );
  }

  const nft = await NFT.findById(_id);

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  nft.tokens_sold += purchased_amount;

  const saved_nft = await nft.save();

  const trx = new Transaction({
    nft: _id,
    buyer: web3.utils.toChecksumAddress(buyer),
    seller: web3.utils.toChecksumAddress(seller),
    token_amount: purchased_amount,
    token_price: token_price,
  });

  saved_trx = await trx.save();

  res.status(200).json({
    status: 'success',
    message: responseMessages.NFT_OWNERSHIP_TRANSFERRED,
    message_description: 'NFT ownership transferred!',
    nft: saved_nft,
    trx: saved_trx,
  });
});
