const Crud = require('../services/Crud');
const NFT = require('../model/Nft');
const Transaction = require('../model/Transaction');
const responseMessages = require('../config/response_messages');
const catchAsync = require('../utils/catch_async');
const AppError = require('../utils/AppError');
const web3 = require('../config/web3');
const User = require('../model/User');

/**
 * POST
 * Minting a New NFT
 */

exports.mint = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    token_name,
    file_hash,
    file_format,
    owner,
    metadata_hash,
  } = req.body;
  let { token_amount, price } = req.body;

  if (
    !name.trim() ||
    !description.trim() ||
    !token_name.trim() ||
    !token_amount ||
    !price ||
    !file_hash.trim() ||
    !file_format.trim() ||
    !owner.trim() ||
    !metadata_hash.trim()
  ) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'Name, description, token_name, token_amount, price, file_hash, file_format, owner, metadata_hash fields are required!',
        400
      )
    );
  }

  token_amount = Number(token_amount);
  price = Number(price);

  if (isNaN(token_amount) || isNaN(price)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE_TYPE,
        'Token Amount and Price should be numbers!',
        400
      )
    );
  }

  if (!web3.utils.isAddress(owner)) {
    return next(
      new AppError(
        responseMessages.INVALID_ACCOUNT_ADDRESS,
        'Account Address is invalid!',
        400
      )
    );
  }

  const new_nft = new NFT({
    name,
    description,
    token_name,
    token_amount,
    price,
    file_hash,
    file_format,
    metadata_hash,
    owner,
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
  if (price < 0.1) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE,
        'Price should be greater than 0.1 NTR!',
        400
      )
    );
  }

  const nft = await NFT.findById(req.params.id);

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
 * Getting One NFT
 */

exports.getOneNft = catchAsync(async (req, res, next) => {
  const nft = await NFT.findById(req.params.id).populate('influencer');

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  if (nft.influencer.length == 0) {
    return next(
      new AppError(
        responseMessages.INFLUENCER_NOT_FOUND,
        `Influencer belonging to the NFT doesn't exist!`,
        404
      )
    );
  }

  const user = await User.findOne({
    account_address: web3.utils.toChecksumAddress(
      nft.influencer[0].account_address
    ),
  });

  if (!user) {
    return next(
      new AppError(
        responseMessages.USER_NOT_FOUND,
        `The User belonging to the Influencer doesn't exist`,
        404
      )
    );
  }

  const modified_nft = {
    ...nft._doc,
    influencer: { ...nft.influencer[0]._doc, user },
  };

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'NFT Data',
    nft: modified_nft,
  });
});

/**
 * PATCH
 * Transfering Ownership of an NFT
 */

exports.buy = catchAsync(async (req, res, next) => {
  const { _id, seller, buyer, transaction_hash } = req.body;
  let { token_price, purchased_amount } = req.body;

  if (
    !_id ||
    !seller ||
    !buyer ||
    !purchased_amount ||
    !token_price ||
    !transaction_hash
  ) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        '_id, seller, buyer, purchased_amount, transaction_hash and token_price fields are required',
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

  if (purchased_amount > nft.token_amount - nft.tokens_sold) {
    return next(
      new AppError(
        responseMessages.HIGH_PURCHASE_AMOUNT,
        'purchased_amount is greater than available amount of tokens!',
        400
      )
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
    transaction_hash,
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

/**
 * GET
 * Get all NFTs by address
 */
exports.getNftsByAddress = catchAsync(async (req, res, next) => {
  const all_nfts = await Crud.getList(NFT, {
    owner: web3.utils.toChecksumAddress(req.params.address),
  });

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `All NFTs By Address: ${req.params.address}`,
    nfts: all_nfts,
  });
});

/**
 * GET
 * Get Hot NFT
 */
exports.getHotNfts = catchAsync(async (req, res, next) => {
  const all_nfts = await Crud.getList(NFT, {});
  const all_tranx = await Crud.getList(Transaction, {});

  console.log('ALl Nfts', all_nfts.length);
  console.log('ALl Tranax', all_tranx);
  var hot_nft = [];
  var max = 0;
  var min = 0;
  var maxnft = [];
  for (let i = 0; i < all_nfts.length; i++) {
    hot_nft[i] = await Crud.getCount(Transaction, {
      nft: all_nfts[i]._id,
    });

    if (hot_nft[i] > max) {
      max = hot_nft[i];
      maxnft = all_nfts[i];
    }
  }
  console.log('Total Count', hot_nft);
  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `Hot NFT`,
    hotnftcount: max,
    hotnftdata: maxnft,
  });
});
