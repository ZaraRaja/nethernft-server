const Crud = require('../services/Crud');
const NFT = require('../model/Nft');
const Transaction = require('../model/Transaction');
const responseMessages = require('../config/response_messages');
const catchAsync = require('../utils/catch_async');
const AppError = require('../utils/AppError');
const web3 = require('../config/web3');
const nftStatuses = require('../config/nft_statuses');

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
    status: nftStatuses.FOR_SALE,
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
 * Getting All Nfts For Sale
 */

exports.getForSaleNFTs = catchAsync(async (req, res, next) => {
  const skipValue = req.query.skip || 0;
  const limitValue = req.query.limit || 10;
  const nfts = await NFT.find({ status: nftStatuses.FOR_SALE })
    .skip(skipValue)
    .limit(limitValue);

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'All NFTs',
    count: nfts.length,
    nfts,
  });
});

/**
 * Get
 * Getting All Nfts By Address
 */

exports.getAllNftsByAddress = catchAsync(async (req, res, next) => {
  const nfts = await Crud.getList(NFT, {
    owner: web3.utils.toChecksumAddress(req.params.account_address),
  });

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `All NFTs by ${web3.utils.toChecksumAddress(
      req.params.account_address
    )}`,
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

  if (nft.status !== nftStatuses.FOR_SALE) {
    return next(
      new AppError(
        responseMessages.NFT_NOT_FOR_SALE,
        'NFT is not for sale!',
        403
      )
    );
  }

  nft.owner = web3.utils.toChecksumAddress(buyer);
  nft.status = nftStatuses.NOT_FOR_SALE;
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
  var all_nfts = await Crud.getList(NFT, { status: nftStatuses.FOR_SALE });
  var count = 0;
  var arr = [];
  for (let i = 0; i < all_nfts.length; i++) {
    count = await Crud.getCount(Transaction, {
      nft: all_nfts[i]._id,
    });
    var nft = all_nfts[i];
    arr[i] = { nft, count };
  }

  let sorted = arr.sort((a, b) => (a.count < b.count ? 1 : -1));
  sorted = sorted.slice(0, 4);
  sorted = sorted.map((doc) => {
    return doc.nft;
  });

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `Hot NFT`,
    nfts: sorted,
  });
});

/**
 * PATCH
 * Uodate Status of NFT
 */

exports.updateStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (status !== nftStatuses.FOR_SALE && status !== nftStatuses.NOT_FOR_SALE) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE,
        'Status value is invalid!',
        400
      )
    );
  }

  const nft = await NFT.findOne({
    _id: req.params.id,
    account_address: web3.utils.toChecksumAddress(req.user.account_address),
  });

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  if (req.body.status === nftStatuses.FOR_SALE) {
    nft.status = nftStatuses.FOR_SALE;
  } else if (req.body.status === nftStatuses.NOT_FOR_SALE) {
    nft.status = nftStatuses.NOT_FOR_SALE;
  }

  const saved_nft = await nft.save();

  res.status(200).json({
    status: 'success',
    message:
      saved_nft.status === nftStatuses.FOR_SALE
        ? responseMessages.NFT_LISTED_FOR_SALE
        : responseMessages.NFT_REMOVED_FROM_SALE,
    message_description:
      saved_nft.status === nftStatuses.FOR_SALE
        ? 'NFT successfully listed for sale!'
        : 'NFT successfully removed from sale!',
    nft: saved_nft,
  });
});

/**
 * Get
 * Api for searching nfts
 */

exports.searchForNFTs = catchAsync(async (req, res, next) => {
  const searchField = req.query.name;
  const searchNfts = await NFT.find({
    name: { $regex: searchField, $options: '$i' },
  });

  res.status(200).json({
    status: 'success',
    message: responseMessages.NFT_MINTED,
    message: 'NFT minted successfully!',
    searchNfts,
  });
});
