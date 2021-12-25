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
    metadata_hash,
  } = req.body;
  let { price, owner } = req.body;

  if (
    !name.trim() ||
    !description.trim() ||
    !token_name.trim() ||
    !price ||
    !file_hash.trim() ||
    !file_format.trim() ||
    !owner.trim() ||
    !metadata_hash.trim()
  ) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'Name, description, token_name, price, file_hash, file_format, owner, metadata_hash fields are required!',
        400
      )
    );
  }

  price = Number(price);

  if (isNaN(price)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE_TYPE,
        'Price should be numbers!',
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

  owner = web3.utils.toChecksumAddress(owner);

  if (
    owner !== web3.utils.toChecksumAddress(req.user.influencer.account_address)
  ) {
    return next(
      new AppError(
        responseMessages.ACCOUNT_ADDRESSES_MISMATCH,
        'Account Addresses do not match!',
        403
      )
    );
  }

  const new_nft = new NFT({
    name,
    description,
    token_name,
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
  const nft = await NFT.findById(req.params.id)
    .populate('influencer')
    .populate('user');

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  if (!nft.user) {
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
    influencer: { ...nft.influencer[0]?._doc, user: { ...nft.user[0]?._doc } },
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
  let { token_price } = req.body;

  if (!_id || !seller || !buyer || !token_price || !transaction_hash) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        '_id, seller, buyer, transaction_hash and token_price fields are required',
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
  if (isNaN(token_price)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE_TYPE,
        'Token Price should be a number!',
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

  nft.owner = web3.utils.toChecksumAddress(buyer);
  const saved_nft = await nft.save();

  const trx = new Transaction({
    nft: _id,
    buyer: web3.utils.toChecksumAddress(buyer),
    seller: web3.utils.toChecksumAddress(seller),
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
