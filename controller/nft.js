const NFT = require('../model/Nft');
const Transaction = require('../model/Transaction');
const responseMessages = require('../config/response_messages');
const catchAsync = require('../utils/catch_async');
const AppError = require('../utils/AppError');
const web3 = require('../config/web3');
const nftStatuses = require('../config/nft_statuses');
const User = require('../model/User');
const { ObjectId } = require('mongoose').Types;
const ntrContract = require('../config/ntr_contract');
const ntrContractAddress = process.env.NTR_CONTRACT_ADDRESS;

async function sendNTR(ntr_amount, to) {
  const sender = process.env.ADMIN_ACCOUNT_FOR_BNB_FEE;
  let chainId = 97;
  if (process.env.NODE_ENV === 'production') {
    chainId = 56;
  }

  var count = await web3.eth.getTransactionCount(`${sender}`);

  let value = web3.utils.toWei(`${ntr_amount}`, 'ether');

  let gasLimit = '';
  try {
    gasLimit = await web3.eth.estimateGas({
      from: `${sender}`,
      nonce: web3.utils.toHex(count),
      to: `${ntrContractAddress}`,
      data: ntrContract.methods.transfer(`${to}`, value).encodeABI(),
      chainId: web3.utils.toHex(chainId),
    });
  } catch (error) {
    throw error;
  }

  var trxObj = {
    from: `${sender}`,
    nonce: web3.utils.toHex(count),
    gasPrice: '0x00000002540BE400',
    gasLimit: gasLimit,
    to: `${ntrContractAddress}`,
    value: '0x0',
    data: ntrContract.methods.transfer(`${to}`, value).encodeABI(),
    chainId: chainId,
    common: {
      customChain: {
        chainId,
        networkId: chainId,
      },
    },
  };

  // Sign Transaction
  const rawTransaction = (
    await web3.eth.accounts.signTransaction(
      trxObj,
      process.env.ADMIN_ACCOUNT_FOR_BNB_FEE_PRIVATE_KEY
    )
  ).rawTransaction;

  try {
    return await web3.eth.sendSignedTransaction(rawTransaction);
  } catch (error) {
    throw error;
  }
}

async function sendBNB(bnb_amount, to) {
  const sender = process.env.ADMIN_ACCOUNT_FOR_BNB_FEE;
  let chainId = 97;
  if (process.env.NODE_ENV === 'production') {
    chainId = 56;
  }

  var count = await web3.eth.getTransactionCount(`${sender}`);

  let value = web3.utils.toWei(`${bnb_amount}`, 'ether');

  let gasLimit = '';
  try {
    gasLimit = await web3.eth.estimateGas({
      from: `${sender}`,
      nonce: web3.utils.toHex(count),
      to: `${to}`,
      value: web3.utils.toHex(value),
      chainId: web3.utils.toHex(chainId),
    });
  } catch (error) {
    throw error;
  }

  var trxObj = {
    from: `${sender}`,
    nonce: web3.utils.toHex(count),
    gasPrice: '0x00000002540BE400',
    gasLimit: gasLimit,
    to: `${to}`,
    value: web3.utils.toHex(value),
    chainId: chainId,
    common: {
      customChain: {
        chainId,
        networkId: chainId,
      },
    },
  };

  // Sign Transaction
  const rawTransaction = (
    await web3.eth.accounts.signTransaction(
      trxObj,
      process.env.ADMIN_ACCOUNT_FOR_BNB_FEE_PRIVATE_KEY
    )
  ).rawTransaction;

  try {
    return await web3.eth.sendSignedTransaction(rawTransaction);
  } catch (error) {
    throw error;
  }
}

/**
 * GET
 * Verify Previous Mint Transaction For :nft_id
 */

exports.verifyPreviousMintTrx = catchAsync(async (req, res, next) => {
  const { nft_id } = req.params;

  if (!nft_id?.trim() || nft_id === 'null') {
    return next(
      new AppError(
        responseMessages.PENDING_MINT_NOT_FOUND,
        'Pending mint not found!',
        404
      )
    );
  }

  const trxDoc = await Transaction.findOne({
    nft: nft_id,
    trx_type: 'mint',
    mint_status: 'pending',
    minted_by: web3.utils.toChecksumAddress(req.user.account_address),
  }).populate('nft');

  if (!trxDoc) {
    return next(
      new AppError(
        responseMessages.PENDING_MINT_NOT_FOUND,
        'Pending mint not found!',
        404
      )
    );
  }

  if (!trxDoc.nft) {
    return next(
      new AppError(
        responseMessages.NFT_FOR_PENDING_MINT_NOT_FOUND,
        'NFT for pending mint not found!',
        404
      )
    );
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.PENDING_MINT_VERIFIED,
    message: 'There is a pending mint for this NFT!',
    trxDoc,
  });
});

/**
 * POST
 * Minting a New NFT
 */

exports.mint = catchAsync(async (req, res, next) => {
  const { trx_hash_bnb } = req.body;
  let { fee_paid_in_bnb } = req.body;

  if (!trx_hash_bnb?.trim() || !fee_paid_in_bnb) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'Transaction hash and Fee paid in BNB are required!',
        400
      )
    );
  }

  fee_paid_in_bnb = Number(fee_paid_in_bnb);

  if (isNaN(fee_paid_in_bnb)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE_TYPE,
        'Fee paid in BNB should be numbers!',
        400
      )
    );
  }

  // Verify Transaction Blockchain
  const trxReciept = await web3.eth.getTransactionReceipt(trx_hash_bnb);

  if (
    !trxReciept ||
    (trxReciept && trxReciept.status === false) ||
    (trxReciept &&
      web3.utils.toChecksumAddress(trxReciept.to) !==
        web3.utils.toChecksumAddress(process.env.ADMIN_ACCOUNT_FOR_BNB_FEE)) ||
    (trxReciept &&
      web3.utils.toChecksumAddress(trxReciept.from) !==
        web3.utils.toChecksumAddress(req.user.account_address))
  ) {
    return next(
      new AppError(
        responseMessages.INVALID_TRX_HASH,
        'Transaction hash of BNB is invalid!',
        403
      )
    );
  }

  const prevTrxDoc = await Transaction.findOne({
    trx_hash_bnb: trx_hash_bnb.toLowerCase(),
  });

  if (prevTrxDoc) {
    if (
      !(
        prevTrxDoc.trx_type === 'mint' &&
        prevTrxDoc.mint_status === 'pending' &&
        web3.utils.toChecksumAddress(req.user.account_address) ===
          web3.utils.toChecksumAddress(prevTrxDoc.minted_by)
      )
    ) {
      return next(
        new AppError(
          responseMessages.TRX_HASH_USED,
          'Transaction hash of BNB is already used in another transaction!',
          403
        )
      );
    } else {
      const nft = await NFT.findById(prevTrxDoc.nft);
      if (!nft) {
        return next(
          new AppError(
            responseMessages.NFT_NOT_FOUND,
            'Transaction hash of BNB is already used in minting of another NFT which is deleted!',
            404
          )
        );
      }

      res.status(200).json({
        status: 'success',
        message: responseMessages.NFT_ID_AND_TRX_DOC,
        message: 'You have previously paid the transaction fee for this NFT!',
        nft,
        trxDoc: prevTrxDoc,
      });
    }
  }

  const newTrx = new Transaction({
    trx_type: 'mint',
    minted_by: web3.utils.toChecksumAddress(req.user.account_address),
    mint_status: 'pending',
    trx_hash_bnb,
    fee_paid_in_bnb,
  });

  const newNft = new NFT({
    owner: web3.utils.toChecksumAddress(req.user.account_address),
    status: nftStatuses.NOT_FOR_SALE,
    mint_trx_id: newTrx._id,
    token_amount: 1,
  });

  newTrx.nft = newNft;

  const saved_newTrx = await newTrx.save();
  const saved_newNft = await newNft.save();

  res.status(200).json({
    status: 'success',
    message: responseMessages.NFT_MINTED,
    message: 'NFT minted successfully!',
    nft: saved_newNft,
    trxDoc: saved_newTrx,
  });
});

/**
 * POST
 * Complete Mint of NFT
 */
exports.completeMint = catchAsync(async (req, res, next) => {
  const {
    nft_id,
    mint_trx_id,
    name,
    category,
    description,
    token_name,
    file_hash,
    file_format,
    metadata_hash,
  } = req.body;
  let { price_in_ntr } = req.body;

  if (
    !nft_id.trim() ||
    !mint_trx_id.trim() ||
    !name.trim() ||
    !description.trim() ||
    !token_name.trim() ||
    !price_in_ntr ||
    !file_hash.trim() ||
    !file_format.trim() ||
    !metadata_hash.trim() ||
    !category.trim()
  ) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'NFT ID, Mint Trx ID, Name, description, token name, price in NTR, file hash, file format, and metadata hash fields are required!',
        400
      )
    );
  }

  if (!/^[A-Z0-9_.]*$/.test(token_name)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE,
        'NFT Symbol can contain Alphabets, numbers and _ .',
        400
      )
    );
  }

  price_in_ntr = Number(price_in_ntr);

  if (isNaN(price_in_ntr)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE_TYPE,
        'Price in NTR should be numbers!',
        400
      )
    );
  }
  let duplicate_nft = await NFT.findOne().or([
    { token_name: token_name.toUpperCase() },
    { metadata_hash },
    { file_hash },
  ]);

  if (duplicate_nft) {
    return next(
      new AppError(
        responseMessages.DUPLICATE_FIELDS,
        'Token name, meta data hash and file hash should be unique',
        403
      )
    );
  }

  owner = web3.utils.toChecksumAddress(req.user.account_address);

  const nft = await NFT.findOne({
    id: nft_id,
    mint_trx_id,
    owner,
  });

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  const trxDoc = await Transaction.findOne({
    _id: mint_trx_id,
    nft: nft_id,
    trx_type: 'mint',
    minted_by: owner,
  });

  if (!trxDoc) {
    return next(
      new AppError(
        responseMessages.TRX_NOT_FOUND,
        'Transaction does not exist!',
        404
      )
    );
  }
  if (trxDoc.mint_status !== 'pending') {
    return next(
      new AppError(
        responseMessages.NFT_ALREADY_MINTED,
        'Transaction does not exist!',
        404
      )
    );
  }

  nft.name = name;
  nft.description = description;
  nft.token_name = token_name;
  nft.category = category;
  nft.price_in_ntr = price_in_ntr;
  nft.file_hash = file_hash;
  nft.file_format = file_format;
  nft.metadata_hash = metadata_hash;
  nft.owner = owner;
  nft.status = nftStatuses.FOR_SALE;

  trxDoc.mint_status = 'complete';

  const saved_nft = await nft.save();
  const saved_trxDoc = await trxDoc.save();

  res.status(200).json({
    status: 'success',
    message: responseMessages.NFT_MINTED,
    message: 'NFT minted successfully!',
    nft: saved_nft,
    trxDoc: saved_trxDoc,
  });
});

/**
 * GET
 * Verify Previous Transfer Transaction For :nft_id
 */

exports.verifyPreviousTransferTrx = catchAsync(async (req, res, next) => {
  const { nft_id } = req.params;

  if (!nft_id?.trim() || nft_id === 'null') {
    return next(
      new AppError(
        responseMessages.PENDING_TRANSFER_NOT_FOUND,
        'Pending transfer transaction not found!',
        404
      )
    );
  }

  const trxDoc = await Transaction.findOne({
    nft: nft_id,
    trx_type: 'transfer',
    transfer_status: 'pending',
    buyer: web3.utils.toChecksumAddress(req.user.account_address),
  }).populate('nft');

  if (!trxDoc) {
    return next(
      new AppError(
        responseMessages.PENDING_TRANSFER_NOT_FOUND,
        'Pending transfer transaction not found!',
        404
      )
    );
  }

  if (!trxDoc.nft) {
    return next(
      new AppError(
        responseMessages.NFT_FOR_PENDING_TRANSFER_NOT_FOUND,
        'NFT for pending transfer not found!',
        404
      )
    );
  }

  if (
    web3.utils.toChecksumAddress(trxDoc.nft.owner) !==
    web3.utils.toChecksumAddress(trxDoc.seller)
  ) {
    await trxDoc.remove();
    return next(
      new AppError(
        responseMessages.NFT_FOR_PENDING_TRANSFER_NOT_FOUND,
        'NFT is already sold!',
        404
      )
    );
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.PENDING_TRANSFER_VERIFIED,
    message: 'There is a pending transfer for this NFT!',
    trxDoc,
  });
});

/**
 * POST
 * Transfering an NFT
 */

exports.transfer = catchAsync(async (req, res, next) => {
  const { trx_hash_bnb, nft_id } = req.body;
  let { fee_paid_in_bnb } = req.body;

  if (!nft_id?.trim() || !trx_hash_bnb?.trim() || !fee_paid_in_bnb) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'NFT ID, Transaction hash and Fee paid in BNB are required!',
        400
      )
    );
  }

  const nft = await NFT.findById(nft_id);

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  if (nft.status !== nftStatuses.FOR_SALE) {
    return next(
      new AppError(
        responseMessages.NFT_NOT_FOR_SALE,
        'NFT is not listed for sale!',
        403
      )
    );
  }

  fee_paid_in_bnb = Number(fee_paid_in_bnb);

  if (isNaN(fee_paid_in_bnb)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE_TYPE,
        'Fee paid in BNB should be numbers!',
        400
      )
    );
  }

  // Verify Transaction Blockchain
  const trxReciept = await web3.eth.getTransactionReceipt(trx_hash_bnb);

  if (
    !trxReciept ||
    (trxReciept && trxReciept.status === false) ||
    (trxReciept &&
      web3.utils.toChecksumAddress(trxReciept.to) !==
        web3.utils.toChecksumAddress(process.env.ADMIN_ACCOUNT_FOR_BNB_FEE)) ||
    (trxReciept &&
      web3.utils.toChecksumAddress(trxReciept.from) !==
        web3.utils.toChecksumAddress(req.user.account_address))
  ) {
    return next(
      new AppError(
        responseMessages.INVALID_TRX_HASH,
        'Transaction hash of BNB is invalid!',
        403
      )
    );
  }

  const prevTrxDoc = await Transaction.findOne({
    trx_hash_bnb: trx_hash_bnb.toLowerCase(),
  });

  if (prevTrxDoc) {
    if (
      !(
        prevTrxDoc.trx_type === 'transfer' &&
        prevTrxDoc.transfer_status === 'pending' &&
        web3.utils.toChecksumAddress(req.user.account_address) ===
          web3.utils.toChecksumAddress(prevTrxDoc.buyer)
      )
    ) {
      return next(
        new AppError(
          responseMessages.TRX_HASH_USED,
          'Transaction hash of BNB is already used in another transaction!',
          403
        )
      );
    } else {
      if (!nft._id.equals(prevTrxDoc.nft)) {
        return next(
          new AppError(
            responseMessages.TRX_HASH_USED_IN_PENDING_TRANSFER,
            'Transaction hash of BNB is used in one of your pending transfer transactions!',
            403
          )
        );
      }

      res.status(200).json({
        status: 'success',
        message: responseMessages.NFT_ID_AND_TRX_DOC,
        message: 'You have previously paid the transaction fee for this NFT!',
        nft,
        trxDoc: prevTrxDoc,
      });
    }
  }

  const newTrx = new Transaction({
    trx_type: 'transfer',
    transfer_status: 'pending',
    buyer: web3.utils.toChecksumAddress(req.user.account_address),
    seller: web3.utils.toChecksumAddress(nft.owner),
    trx_hash_bnb,
    fee_paid_in_bnb,
    nft: nft._id,
  });

  const saved_newTrx = await newTrx.save();

  res.status(200).json({
    status: 'success',
    message: responseMessages.TRX_HASH_VALID,
    message: 'You can buy this NFT now!',
    nft,
    trxDoc: saved_newTrx,
  });
});

/**
 * PATCH
 * update the nft price
 */
exports.updatePrice = catchAsync(async (req, res, next) => {
  let { price_in_ntr } = req.body;
  const { nft_id } = req.params;

  if (!price_in_ntr) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'Price in NTR is required!',
        400
      )
    );
  }

  price_in_ntr = Number(price_in_ntr);

  if (isNaN(price_in_ntr)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE_TYPE,
        'Price in NTR should be number!',
        400
      )
    );
  }

  const nft = await NFT.findOne({
    _id: nft_id,
    owner: web3.utils.toChecksumAddress(req.user.account_address),
  });

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  nft.price_in_ntr = price_in_ntr;
  const savedNft = await nft.save();

  res.status(200).json({
    status: 'success',
    message: responseMessages.NFT_PRICE_UPDATED,
    message_description: 'NFT price is updated',
    nft: savedNft,
  });
});

/**
 * PATCH
 * Completing Transfering of an NFT
 */

exports.transferComplete = catchAsync(async (req, res, next) => {
  const { trx_hash_bnb, nft_id, trx_hash_ntr } = req.body;
  let { price_in_ntr } = req.body;

  if (
    !nft_id?.trim() ||
    !trx_hash_bnb?.trim() ||
    !trx_hash_ntr ||
    !price_in_ntr
  ) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'NFT ID, Transaction hash of BNB, Transaction hash of NTRs, and Price in NTR are required!',
        400
      )
    );
  }

  price_in_ntr = Number(price_in_ntr);

  if (isNaN(price_in_ntr)) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE_TYPE,
        'Price in NTR should be numbers!',
        400
      )
    );
  }

  const nft = await NFT.findById(nft_id).populate('mint_trx_id');

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  if (nft.status !== nftStatuses.FOR_SALE) {
    return next(
      new AppError(
        responseMessages.NFT_NOT_FOR_SALE,
        'NFT is not listed for sale!',
        403
      )
    );
  }

  const trxDoc = await Transaction.findOne({
    trx_hash_bnb,
    nft: nft_id,
    transfer_status: 'pending',
    buyer: web3.utils.toChecksumAddress(req.user.account_address),
  });

  if (!trxDoc) {
    return next(
      new AppError(
        responseMessages.TRX_NOT_FOUND,
        'Transaction does not exist!',
        404
      )
    );
  }

  if (
    web3.utils.toChecksumAddress(nft.owner) !==
    web3.utils.toChecksumAddress(trxDoc.seller)
  ) {
    return next(
      new AppError(
        responseMessages.NFT_ALREADY_SOLD,
        'NFT is already sold!',
        403
      )
    );
  }

  // Verify Transaction Blockchain
  const trxReciept = await web3.eth.getTransactionReceipt(trx_hash_ntr);

  if (
    !trxReciept ||
    (trxReciept && trxReciept.status === false) ||
    (trxReciept &&
      web3.utils.toChecksumAddress(trxReciept.to) !==
        web3.utils.toChecksumAddress(process.env.NTR_CONTRACT_ADDRESS)) ||
    (trxReciept &&
      web3.utils.toChecksumAddress(trxReciept.from) !==
        web3.utils.toChecksumAddress(req.user.account_address))
  ) {
    return next(
      new AppError(
        responseMessages.INVALID_TRX_HASH,
        'Transaction hash of NTR is invalid!',
        403
      )
    );
  }

  const duplicate = await NFT.findOne({ transfer_trx_id: trxDoc._id });

  if (duplicate) {
    return next(
      new AppError(
        responseMessages.TRANSFER_TRX_USED,
        'The Transfer Transaction is used in transfer of another NFT!',
        403
      )
    );
  }

  // Send 3% to company wallet
  const _3Percent = (3 / 100) * price_in_ntr;
  let trxObj = await sendNTR(
    _3Percent,
    process.env.COMPANY_ACCOUNT_FOR_NTR_FEE
  );
  trxDoc.trx_hash_ntr_company = trxObj.transactionHash;

  // Send 2% to Minter wallet
  const _2Percent = (2 / 100) * price_in_ntr;
  trxObj = await sendNTR(_2Percent, nft.mint_trx_id.minted_by);
  trxDoc.trx_hash_ntr_minter = trxObj.transactionHash;

  // Send 95% to seller wallet
  const _95Percent = (95 / 100) * price_in_ntr;
  trxObj = await sendNTR(_95Percent, trxDoc.seller);
  trxDoc.trx_hash_ntr = trxObj.transactionHash;

  // Update NFT Document
  nft.owner = trxDoc.buyer;
  nft.transfer_trx_id = trxDoc._id;
  nft.status = nftStatuses.NOT_FOR_SALE;
  nft.listing_trx_id = null;

  // Update Transaction Document
  trxDoc.transfer_status = 'complete';
  trxDoc.price_in_ntr = price_in_ntr;
  // trxDoc.trx_hash_ntr = trx_hash_ntr;

  const saved_trxDoc = await trxDoc.save();
  const saved_nft = await nft.save();

  // Get Admin Account BNB Balance
  const balance = web3.utils.fromWei(
    `${await web3.eth.getBalance(process.env.ADMIN_ACCOUNT_FOR_BNB_FEE)}`,
    'ether'
  );

  if (balance > 0.5) {
    try {
      await sendBNB(balance - 0.5, process.env.COMPANY_ACCOUNT_FOR_NTR_FEE);
    } catch (error) {
      throw error;
    }
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.TRANSFER_COMPLETE,
    message: 'You have successfully bought the NFT!',
    nft: saved_nft,
    trxDoc: saved_trxDoc,
  });
});

/**
 * Get
 * Getting All Nfts For Sale
 */

async function paginatedResults(req, model, filter, options = {}) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};

  const count = await model.countDocuments(filter).exec();

  if (endIndex < count) {
    results.next = {
      page: page + 1,
      limit: limit,
    };
  }

  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit,
    };
  }
  try {
    let dbQuery = model
      .find(filter)
      .populate('user', {
        account_address: 1,
        name: 1,
        profile_image: 1,
      })
      .limit(limit)
      .skip(startIndex);
    if (options.sort) {
      dbQuery = dbQuery.sort(options.sort);
    }

    results.nfts = await dbQuery.exec();
    return results;
  } catch (e) {
    throw e;
  }
}

exports.getForSaleNFTs = catchAsync(async (req, res) => {
  const file_format = req.query.file_format || 'all';
  const category = req.query.category || 'all';

  const filter = { status: nftStatuses.FOR_SALE };
  let result;
  if (file_format === 'all' && category === 'all') {
    result = await paginatedResults(req, NFT, filter);
  } else if (file_format === 'all' && category === 'new') {
    result = await paginatedResults(req, NFT, filter, {
      sort: { createdAt: -1 },
    });
  } else if (
    file_format === 'all' &&
    category !== 'all' &&
    category !== 'new'
  ) {
    result = await paginatedResults(req, NFT, { ...filter, category });
  } else if (file_format !== 'all' && category === 'all') {
    result = await paginatedResults(req, NFT, { ...filter, file_format });
  } else if (file_format !== 'all' && category === 'new') {
    result = await paginatedResults(
      req,
      NFT,
      { ...filter, file_format },
      { sort: { createdAt: -1 } }
    );
  } else {
    result = await paginatedResults(req, NFT, {
      ...filter,
      category,
      file_format,
    });
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'All NFTs',
    count: result.nfts.length,
    data: result,
  });
});

/**
 * Get
 * Getting All Nfts By Address
 */

exports.getAllNftsByAddress = catchAsync(async (req, res) => {
  let nfts = await NFT.find({
    owner: web3.utils.toChecksumAddress(req.params.account_address),
  })
    .populate('mint_trx_id')
    .populate('user', { name: 1, account_address: 1, profile_image: 1 });

  nfts = nfts.filter((N) => {
    return N.mint_trx_id.mint_status === 'complete';
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
    .populate('user')
    .populate('mint_trx_id');

  if (!nft || nft.mint_trx_id.mint_status !== 'complete') {
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

  const minted_by = modified_nft.mint_trx_id.minted_by;

  if (
    web3.utils.toChecksumAddress(minted_by) !==
    web3.utils.toChecksumAddress(nft.user[0].account_address)
  ) {
    const result = await User.findOne(
      {
        account_address: minted_by,
      },
      { username: 1, name: 1, account_address: 1, profile_image: 1 }
    );

    modified_nft.minted_by = result;
  } else {
    modified_nft.minted_by = {
      name: nft.user[0].name,
      username: nft.user[0].username,
      account_address: nft.user[0].account_address,
      profile_image: nft.user[0].profile_image,
    };
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'NFT Data',
    nft: modified_nft,
  });
});

/**
 * GET
 * Get Hot NFT
 */
exports.getHotNfts = catchAsync(async (req, res) => {
  let nfts = await Transaction.aggregate([
    {
      $match: {
        trx_type: 'transfer',
      },
    },
    {
      $group: {
        _id: '$nft',
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
    {
      $lookup: {
        from: NFT.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'nft',
      },
    },
    {
      $unwind: '$nft',
    },
    {
      $match: { 'nft.status': 'for_sale' },
    },
    {
      $limit: 4,
    },
    {
      $replaceRoot: {
        newRoot: '$nft',
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        let: { owner: '$owner' },
        pipeline: [
          { $match: { $expr: { $eq: ['$account_address', '$$owner'] } } },
          { $project: { name: 1, account_address: 1, profile_image: 1 } },
        ],
        as: 'user',
      },
    },
  ]);

  if (nfts.length < 4) {
    const res = await NFT.aggregate([
      {
        $match: {
          _id: { $nin: nfts.map((n) => ObjectId(n._id)) },
          status: 'for_sale',
        },
      },
      {
        $limit: 4 - nfts.length,
      },
      {
        $lookup: {
          from: User.collection.name,
          let: { owner: '$owner' },
          pipeline: [
            { $match: { $expr: { $eq: ['$account_address', '$$owner'] } } },
            { $project: { name: 1, account_address: 1, profile_image: 1 } },
          ],
          as: 'user',
        },
      },
    ]);

    nfts = [...nfts, ...res];
  }

  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: `Hot NFT`,
    nfts,
  });
});

/**
 * GET
 * Update Status of NFT
 */
exports.verifyPreviousListingTrx = catchAsync(async (req, res, next) => {
  const { nft_id } = req.params;

  if (!nft_id?.trim() || nft_id === 'null') {
    return next(
      new AppError(
        responseMessages.PREVIOUS_LISTING_NOT_FOUND,
        'Previous Listing transaction not found!',
        404
      )
    );
  }

  const nft = await NFT.findOne({
    _id: nft_id,
    owner: web3.utils.toChecksumAddress(req.user.account_address),
  })
    .populate('mint_trx_id')
    .populate('listing_trx_id');

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  if (
    !nft.listing_trx_id &&
    web3.utils.toChecksumAddress(nft.mint_trx_id.minted_by) !==
      web3.utils.toChecksumAddress(req.user.account_address)
  ) {
    return next(
      new AppError(
        responseMessages.PREVIOUS_LISTING_NOT_FOUND,
        'Previous Listing transaction not found!',
        404
      )
    );
  }

  if (
    !nft.listing_trx_id &&
    web3.utils.toChecksumAddress(nft.mint_trx_id.minted_by) ===
      web3.utils.toChecksumAddress(req.user.account_address) &&
    !nft.transfer_trx_id
  ) {
    console.log('NFT', nft);
    return res.status(200).json({
      status: 'success',
      message: responseMessages.MINTER_IS_OWNER,
      message_description: 'NFT minter is the owner!',
    });
  }

  if (
    !nft.listing_trx_id &&
    web3.utils.toChecksumAddress(nft.mint_trx_id.minted_by) ===
      web3.utils.toChecksumAddress(req.user.account_address) &&
    nft.transfer_trx_id
  ) {
    return next(
      new AppError(
        responseMessages.PREVIOUS_LISTING_NOT_FOUND,
        'Previous Listing transaction not found!',
        404
      )
    );
  }

  if (
    nft.listing_trx_id &&
    web3.utils.toChecksumAddress(nft.listing_trx_id.owner) !==
      web3.utils.toChecksumAddress(req.user.account_address)
  ) {
    return next(
      new AppError(
        responseMessages.PREVIOUS_LISTING_NOT_FOUND,
        'Previous Listing transaction not found!',
        404
      )
    );
  }

  const trxDoc = nft.listing_trx_id;

  res.status(200).json({
    status: 'success',
    message: responseMessages.PREVIOUS_LISTING_VERIFIED,
    message: 'There is a previous listing transaction for this NFT!',
    trxDoc,
  });
});

/**
 * POST
 * Update Sale Status of NFT
 */

exports.updateSaleStatus = catchAsync(async (req, res, next) => {
  const { trx_hash_bnb, nft_id, listing_status } = req.body;
  let { fee_paid_in_bnb } = req.body;

  if (!listing_status?.trim() || !nft_id?.trim()) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'Listing Status and NFT ID are required!',
        400
      )
    );
  }
  if (
    listing_status !== nftStatuses.FOR_SALE &&
    listing_status !== nftStatuses.NOT_FOR_SALE
  ) {
    return next(
      new AppError(
        responseMessages.INVALID_VALUE,
        'Status value is invalid!',
        400
      )
    );
  }

  const nft = await NFT.findOne({
    _id: nft_id,
    account_address: web3.utils.toChecksumAddress(req.user.account_address),
  })
    .populate('mint_trx_id')
    .populate('listing_trx_id');

  if (!nft) {
    return next(
      new AppError(responseMessages.NFT_NOT_FOUND, 'NFT does not exist!', 404)
    );
  }

  if (
    !nft.listing_trx_id &&
    web3.utils.toChecksumAddress(nft.mint_trx_id.minted_by) !==
      web3.utils.toChecksumAddress(req.user.account_address) &&
    (!trx_hash_bnb || !fee_paid_in_bnb)
  ) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'Transaction hash of BNB and Fee paid in BNB is required!',
        400
      )
    );
  }

  if (
    nft.listing_trx_id &&
    web3.utils.toChecksumAddress(nft.listing_trx_id.owner) !==
      web3.utils.toChecksumAddress(req.user.account_address) &&
    (!trx_hash_bnb || !fee_paid_in_bnb)
  ) {
    return next(
      new AppError(
        responseMessages.MISSING_REQUIRED_FIELDS,
        'Transaction hash of BNB and Fee paid in BNB is required!',
        404
      )
    );
  }

  // Confirm Transaction Hash From Blockchain, In case when Minter is Not the Owner
  if (trx_hash_bnb) {
    const trxReciept = await web3.eth.getTransactionReceipt(trx_hash_bnb);

    if (
      !trxReciept ||
      (trxReciept && trxReciept.status === false) ||
      (trxReciept &&
        web3.utils.toChecksumAddress(trxReciept.to) !==
          web3.utils.toChecksumAddress(
            process.env.ADMIN_ACCOUNT_FOR_BNB_FEE
          )) ||
      (trxReciept &&
        web3.utils.toChecksumAddress(trxReciept.from) !==
          web3.utils.toChecksumAddress(req.user.account_address))
    ) {
      return next(
        new AppError(
          responseMessages.INVALID_TRX_HASH,
          'Transaction hash of BNB is invalid!',
          403
        )
      );
    }

    // Find if this trx_hash_bnb is never used before
    const prevTrxDoc = await Transaction.findOne({
      trx_hash_bnb: trx_hash_bnb.toLowerCase(),
    });

    if (prevTrxDoc) {
      if (
        !(
          prevTrxDoc.trx_type === 'listing' &&
          web3.utils.toChecksumAddress(req.user.account_address) ===
            web3.utils.toChecksumAddress(prevTrxDoc.owner)
        )
      ) {
        return next(
          new AppError(
            responseMessages.TRX_HASH_USED,
            'Transaction hash of BNB is already used in another transaction!',
            403
          )
        );
      } else {
        if (!nft._id.equals(prevTrxDoc.nft)) {
          return next(
            new AppError(
              responseMessages.TRX_HASH_USED_IN_ANOTHER_LISTING,
              'Transaction hash of BNB is used in one of your another listing transactions!',
              403
            )
          );
        }

        // Update Exisiting Transaction Doc and NFT doc
        nft.status = listing_status;
        prevTrxDoc.listing_status = listing_status;

        const saved_nft = await nft.save();
        await prevTrxDoc.save();
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
          nft,
        });
      }
    }
    // Else a New Transaction Document will be created and NFT Document will be updated
    const newTrx = new Transaction({
      owner: web3.utils.toChecksumAddress(req.user.account_address),
      trx_hash_bnb,
      fee_paid_in_bnb,
      nft: nft._id,
      trx_type: 'listing',
      listing_status: listing_status,
    });

    await newTrx.save();
    nft.status = listing_status;
    nft.listing_trx_id = newTrx._id;
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
      nft,
    });
  }

  nft.status = listing_status;
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

exports.search = catchAsync(async (req, res) => {
  const searchField = req.query.q;
  const searchNfts = await NFT.find({
    name: { $regex: searchField, $options: '$i' },
    status: nftStatuses.FOR_SALE,
  }).populate('user', { name: 1, account_address: 1, profile_image: 1 });

  res.status(200).json({
    status: 'success',
    message: responseMessages.NFT_MINTED,
    message: 'NFT minted successfully!',
    nfts: searchNfts,
  });
});

/**
 * Get
 * Api for road-map of listing
 */

exports.getRoadMap = catchAsync(async (req, res) => {
  const roadmap = await Transaction.aggregate([
    {
      $match: {
        nft: ObjectId(req.params.id),
        $expr: {
          $or: [
            {
              $and: [
                { $eq: ['$trx_type', 'mint'] },
                { $eq: ['$mint_status', 'complete'] },
              ],
            },
            {
              $and: [
                { $eq: ['$trx_type', 'transfer'] },
                { $eq: ['$transfer_status', 'complete'] },
              ],
            },
            { $eq: ['$trx_type', 'listing'] },
          ],
        },
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        let: {
          owner: '$owner',
          minted_by: '$minted_by',
          buyer: '$buyer',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$account_address', '$$owner'] },
                  { $eq: ['$account_address', '$$minted_by'] },
                  { $eq: ['$account_address', '$$buyer'] },
                ],
              },
            },
          },
          {
            $project: {
              name: 1,
              username: 1,
              account_address: 1,
              profile_image: 1,
            },
          },
        ],
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    message: responseMessages.NFT_MINTED,
    message: 'NFT History',
    count: roadmap.length,
    roadmap,
  });
});

/**
 * Get
 * Getting All Transactions For Admin
 */

exports.getAllTransactions = catchAsync(async (req, res) => {
  const options = {
    page: req.query.page,
    limit: req.query.limit,
  };

  const data = await Transaction.aggregatePaginate(
    Transaction.aggregate([
      {
        $lookup: {
          from: NFT.collection.name,
          localField: 'nft',
          foreignField: '_id',
          as: 'nft',
        },
      },

      {
        $lookup: {
          from: User.collection.name,
          let: {
            owner: '$owner',
            minted_by: '$minted_by',
            buyer: '$buyer',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$account_address', '$$owner'] },
                    { $eq: ['$account_address', '$$minted_by'] },
                    { $eq: ['$account_address', '$$buyer'] },
                  ],
                },
              },
            },
          ],
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $unwind: {
          path: '$nft',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      {
        $project: {
          trx_type: 1,
          trx_hash_bnb: 1,
          nft_id: '$nft._id',
          nft_name: '$nft.name',
          user_name: '$user.name',
          user_account_address: '$user.account_address',
        },
      },
    ]),
    options
  );
  res.status(200).json({
    status: 'success',
    message: responseMessages.OK,
    message_description: 'All Transactions',
    totalData: data.totalDocs,
    totalPages: data.totalPages,
    page: data.page,
    limit: data.limit,
    pagingCounter: data.pagingCounter,
    hasPreviousPage: data.hasPrevPage,
    hasNextPage: data.hasNextPage,
    previousPage: data.prevPage,
    nextPage: data.nextPage,
    transactions: data.docs,
  });
});
