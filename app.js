const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const queryParser = require('express-query-int');
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
app.use(queryParser());

app.use('/uploads', express.static(__dirname + '/uploads'));

/**
 * App middlwares
 */
// const launchpadUpload = require('./middlewares/launchpad_upload');
const influencerUpload = require('./middlewares/influencer_upload');
const auth = require('./middlewares/auth');

/**
 * App Controllers.
 */
const AuthController = require('./controller/auth');
const NFTController = require('./controller/nft');
// const LaunchpadController = require('./controller/launchpad');
const InfluencerController = require('./controller/influencer');
const UserController = require('./controller/user');
const userRoles = require('./config/user_roles');

/**
 * Primary app routes.
 */

// NFT Routes
app.get('/api/nfts', NFTController.getForSaleNFTs);
app.post(
  '/api/nfts/mint',
  auth.authenticate,
  auth.authorize(userRoles.INFLUENCER),
  NFTController.mint
);
app.get('/api/nfts/search', NFTController.searchForNFTs);
app.patch('/api/nfts/buy', auth.authenticate, NFTController.buy);
app.get('/api/nfts/hot', NFTController.getHotNfts); // TODO: Get list of HOT NFTs not single NFT
app.patch(
  '/api/nfts/update-status/:id',
  auth.authenticate,
  NFTController.updateStatus
);
app.get('/api/nfts/by/:account_address', NFTController.getAllNftsByAddress);
app.get('/api/nfts/:id', NFTController.getOneNft);

// Launchpad Routes
// app.post('/api/launchpad', launchpadUpload, LaunchpadController.create);

// Influencers Routes
app.post(
  '/api/influencers',
  auth.authenticate,
  auth.authorize(userRoles.USER, userRoles.ADMIN),
  InfluencerController.becomeInfluencer
);
app.get('/api/influencers', InfluencerController.getAllInfluencers);
app.get(
  '/api/influencers/pending',
  auth.authenticate,
  auth.authorize(userRoles.ADMIN),
  InfluencerController.getPendingInfluencers
);
app.get(
  '/api/influencers/:address',
  InfluencerController.getInfluencerByAddress
);
app.get(
  '/api/influencers/:address/nfts',
  InfluencerController.getInfluencerWithNfts
);
app.post(
  '/api/influencers/upload-images',
  auth.authenticate,
  auth.authorize(userRoles.USER, userRoles.ADMIN),
  influencerUpload,
  InfluencerController.uploadInflencerImages
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
  auth.authorize(userRoles.USER),
  InfluencerController.follow
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
