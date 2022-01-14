const nftStatuses = require('../config/nft_statuses');
const responseMessages = require('../config/response_messages');
const web3 = require('../config/web3');
const Bid = require('../model/Bid');
const NFT = require('../model/Nft');
const Transaction = require('../model/Transaction');
const AppError = require('./AppError');
const { sendNTR } = require('./send_crypto');

module.exports = async (nft_id) => {
  try {
    // Get th NFT
    const nft = await NFT.findById(nft_id).populate('mint_trx_id', {
      minted_by: 1,
    });
    if (!nft) {
      throw new AppError(
        responseMessages.NFT_NOT_FOUND,
        'NFT does not exist!',
        404
      );
    }

    // Get all bids of that NFT
    const bids = await Bid.find({ nft: nft_id, bid_status: 'current' }).sort({
      bid_price_ntr: -1,
    });

    // Get the Highest Bid
    const highestBid = bids[0];

    // Create a Transfer Transaction to Transfer NFT to the Highest Bidder
    if (
      web3.utils.toChecksumAddress(nft.owner) !==
      web3.utils.toChecksumAddress(highestBid.auction_by)
    ) {
      throw new AppError(
        responseMessages.NFT_ALREADY_SOLD,
        'NFT is already sold!',
        403
      );
    }

    const trxDoc = new Transaction({
      trx_type: 'transfer',
      transfer_status: 'complete',
      buyer: web3.utils.toChecksumAddress(highestBid.bidder),
      seller: web3.utils.toChecksumAddress(nft.owner),
      trx_hash_bnb: highestBid.trx_hash_bnb,
      fee_paid_in_bnb: highestBid.fee_paid_in_bnb,
      price_in_ntr: highestBid.bid_price_ntr,
      nft: nft.id,
    });

    // Send 3% to company wallet
    const _3Percent = (3 / 100) * highestBid.bid_price_ntr;
    let trxObj = await sendNTR(
      _3Percent,
      process.env.COMPANY_ACCOUNT_FOR_NTR_FEE
    );
    trxDoc.trx_hash_ntr_company = trxObj.transactionHash;

    // Send 2% to Minter wallet
    const _2Percent = (2 / 100) * highestBid.bid_price_ntr;
    trxObj = await sendNTR(_2Percent, nft.mint_trx_id.minted_by);
    trxDoc.trx_hash_ntr_minter = trxObj.transactionHash;

    // Send 95% to seller wallet
    const _95Percent = (95 / 100) * highestBid.bid_price_ntr;
    trxObj = await sendNTR(_95Percent, trxDoc.seller);
    trxDoc.trx_hash_ntr = trxObj.transactionHash;

    // Update NFT Document
    nft.owner = trxDoc.buyer;
    nft.transfer_trx_id = trxDoc._id;
    nft.status = nftStatuses.NOT_FOR_SALE;
    nft.auction_status = 'complete';
    nft.listing_trx_id = null;

    await trxDoc.save();
    await nft.save();

    // Transfer the NTRs to relative accounts
    for (let i = 0; i < bids.length; i++) {
      if (i !== 0) {
        const trxObj = await sendNTR(bids[i].bid_price_ntr, bids[i].bidder);
        bids[i].trx_hash_returned_ntr = trxObj.transactionHash;
      }
      // Save updated bid documents with trx_hashes of returned NTRs and bid_status = "previous"
      bids[i].bid_status = 'previous';
      await bids[i].save();
    }
  } catch (error) {
    console.error(error);
  }
};
