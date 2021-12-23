const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
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

app.use('/uploads', express.static(__dirname + '/uploads'));

/**
 * App middlwares
 */
const launchpadUpload = require('./middlewares/launchpad_upload');
const influencerUpload = require('./middlewares/influencer_upload');
const auth = require('./middlewares/auth');

/**
 * App Controllers.
 */
const AuthController = require('./controller/auth');
const NFTController = require('./controller/nft');
const LaunchpadController = require('./controller/launchpad');
const InfluencerController = require('./controller/influencer');
const UserController = require('./controller/user');

/**
 * Primary app routes.
 */

// NFT Routes
app.post('/api/nfts/mint', auth.authenticate, NFTController.mint);
app.patch('/api/nfts/price/:id', auth.authenticate, NFTController.updatePrice);
app.get('/api/nfts/by-address/:address', NFTController.getNftsByAddress);
app.patch('/api/nfts/buy', auth.authenticate, NFTController.buy);
app.get('/api/nfts', NFTController.getAllNFTs);
app.get('/api/nfts/hot', NFTController.getHotNfts);
app.get('/api/nfts/:id', NFTController.getOneNft);

// Launchpad Routes
app.post('/api/launchpad', launchpadUpload, LaunchpadController.create);

// Influencers Routes
app.post(
  '/api/influencers',
  auth.authenticate,
  InfluencerController.becomeInfluencer
);
app.get('/api/influencers', InfluencerController.getAllInfluencers);
app.get(
  '/api/influencers/pending',
  InfluencerController.getAllUserInInfluencer
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
  influencerUpload,
  InfluencerController.uploadInflencerImages
);
app.patch(
  '/api/influencers/update-status/:address',
  auth.authenticate,
  InfluencerController.updateStatus
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
app.get(
  '/api/users/singleUser#:account_address',
  UserController.getUserByAddress
);
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
