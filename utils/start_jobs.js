const schedule = require('node-schedule');
const { isPast } = require('date-fns');
const nftStatuses = require('../config/nft_statuses');
const NFT = require('../model/Nft');
const completeAuction = require('./complete_auction');

module.exports = async () => {
  const auctionNFTs = await NFT.find({
    status: nftStatuses.FOR_SALE,
    selling_type: 'auction',
  });

  auctionNFTs.forEach((nft) => {
    if (isPast(nft.auction_end_time) && nft.auction_status === 'complete') {
      return;
    } else if (
      isPast(nft.auction_end_time) &&
      nft.auction_status !== 'complete'
    ) {
      // Call the completeAuction function immediately to clear the pending auctions
      completeAuction(nft.id);
      return;
    }

    // Run the jobs for live auctions
    schedule.scheduleJob(nft.auction_end_time, () => {
      // Call the completeAuction function at specified time
      completeAuction(nft.id);
    });
  });
};
