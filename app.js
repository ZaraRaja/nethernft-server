const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const { queryParser } = require('express-query-parser');
const AppError = require('./utils/AppError');
const errorController = require('./controller/error_controller');
const responseMessages = require('./config/response_messages');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENTNAME,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(helmet());
app.use((req, res, next) => {
  if (req.query.q && req.query.q?.startsWith('0x')) {
    req.query.q = req.query.q?.slice(2);
  }
  next();
});
app.use(
  queryParser({
    parseNull: true,
    parseUndefined: true,
    parseBoolean: true,
    parseNumber: true,
  })
);

app.use('/uploads', express.static(__dirname + '/uploads'));

/**
 * App middlwares
 */
// const launchpadUpload = require('./middlewares/launchpad_upload');
const auth = require('./middlewares/auth');

/**
 * App Controllers.
 */
const AuthController = require('./controller/auth');
const NFTController = require('./controller/nft');
// const LaunchpadController = require('./controller/launchpad');
const InfluencerController = require('./controller/influencer');
const UserController = require('./controller/user');
const S3Controller = require('./controller/s3');
const userRoles = require('./config/user_roles');

/**
 * Primary app routes.
 */

// S3 Routes
app.get('/api/s3-url', auth.authenticate, S3Controller.getS3UploadUrl);

// NFT Routes
app.get('/api/nfts', NFTController.getForSaleNFTs);
app.get(
  '/api/transactions',
  auth.authenticate,
  auth.authorize(userRoles.ADMIN),
  NFTController.getAllTransactions
);
app.patch(
  '/api/nfts/update-price/:nft_id',
  auth.authenticate,
  NFTController.updatePrice
);
app.get(
  '/api/nfts/mint/prev_trx/:nft_id',
  auth.authenticate,
  auth.authorize(userRoles.INFLUENCER),
  NFTController.verifyPreviousMintTrx
);
app.post(
  '/api/nfts/mint',
  auth.authenticate,
  auth.authorize(userRoles.INFLUENCER),
  NFTController.mint
);
app.patch(
  '/api/nfts/mint/complete',
  auth.authenticate,
  auth.authorize(userRoles.INFLUENCER),
  NFTController.completeMint
);
app.get(
  '/api/nfts/transfer/prev_trx/:nft_id',
  auth.authenticate,
  NFTController.verifyPreviousTransferTrx
);
app.post('/api/nfts/transfer', auth.authenticate, NFTController.transfer);
app.patch(
  '/api/nfts/transfer/complete',
  auth.authenticate,
  NFTController.transferComplete
);
app.get('/api/nfts/search', NFTController.search);
app.get('/api/nfts/hot', NFTController.getHotNfts);
app.get(
  '/api/nfts/update-status/prev_trx/:nft_id',
  auth.authenticate,
  NFTController.verifyPreviousListingTrx
);
app.post(
  '/api/nfts/update-status',
  auth.authenticate,
  NFTController.updateSaleStatus
);
app.get('/api/nfts/roadmap/:id', NFTController.getRoadMap);
app.post('/api/nfts/bids', auth.authenticate, NFTController.createBid);
app.get('/api/nfts/bids/:nft_id', NFTController.getAllBidsForNFT);
app.patch(
  '/api/nfts/bids/:id',
  auth.authenticate,
  NFTController.updateBidForNFT
);
app.get('/api/nfts/by/:account_address', NFTController.getAllNftsByAddress);
app.get('/api/nfts/:id', NFTController.getOneNft);
app.get(
  '/api/influencer/details',
  auth.authenticate,
  auth.authorize(userRoles.ADMIN),
  InfluencerController.getAllInfluencerDetails
);

// Influencers Routes
app.post(
  '/api/influencers',
  auth.authenticate,
  auth.authorize(userRoles.USER, userRoles.ADMIN),
  InfluencerController.becomeInfluencer
);
app.patch(
  '/api/influencers/:account',
  auth.authenticate,
  auth.authorize(userRoles.REJECTED_INFLUENCER),
  InfluencerController.updateInfluencer
);

app.get('/api/influencers', InfluencerController.getAllInfluencers);
app.get('/api/influencers/top', InfluencerController.getTopInfluencers);
app.get(
  '/api/influencers/pending',
  auth.authenticate,
  auth.authorize(userRoles.ADMIN),
  InfluencerController.getPendingInfluencers
);
app.patch(
  '/api/influencers/update-status/:address',
  auth.authenticate,
  auth.authorize(userRoles.ADMIN),
  InfluencerController.updateStatus
);
app.patch(
  '/api/influencers/follow/:address',
  auth.authenticate,
  InfluencerController.follow
);
app.get(
  '/api/influencers/:address/followers',
  auth.authenticate,
  InfluencerController.getFollowersByAddress
);
app.get(
  '/api/influencers/:address',
  InfluencerController.getInfluencerByAddress
);
// Auth Routes
app.post('/api/auth/signup', auth.isLoggedIn, AuthController.signup);
app.get(
  '/api/auth/nonce/:account_address',
  auth.isLoggedIn,
  AuthController.getNonce
);
app.post('/api/auth/login', auth.isLoggedIn, AuthController.login);
app.get('/api/auth/logout', auth.isLoggedIn, AuthController.logout);

// Users Routes
app.get('/api/users', UserController.getAllUsers);
app.get('/api/users/me', auth.authenticate, UserController.getMe);
app.get(
  '/api/users/:account_address/following',
  auth.authenticate,
  UserController.getFollowingByAddress
);
app.get('/api/users/:account_address', UserController.getUserByAddress);
app.patch('/api/users', auth.authenticate, UserController.updateUser);

/**
 * Error Handling
 */
app.use((req, res, next) => {
  next(
    new AppError(
      responseMessages.URL_NOT_FOUND,
      `The url ${req.originalUrl} does not exist!`,
      404
    )
  );
});

app.use(errorController);

module.exports = app;
