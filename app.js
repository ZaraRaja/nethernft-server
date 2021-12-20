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
app.get('/api/nfts', NFTController.getAllNFTs);
app.post('/api/nfts/mint', auth.authenticate, NFTController.mint);
app.patch('/api/nfts/price/:id', auth.authenticate, NFTController.updatePrice);
app.get('/api/nfts/price/:id', NFTController.getPrice);
app.patch(
  '/api/nfts/transfer-ownership',
  auth.authenticate,
  NFTController.transferOwnership
);

// Launchpad Routes
app.post('/api/launchpad', launchpadUpload, LaunchpadController.create);

// Influencers Routes
app.post(
  '/api/influencers',
  auth.authenticate,
  InfluencerController.becomeInfluencer
);
app.get(
  '/api/influencers/:address',
  InfluencerController.getInfluencerByAddress
);
app.post(
  '/api/influencers/upload-images',
  auth.authenticate,
  influencerUpload,
  InfluencerController.uploadInflencerImages
);
app.post(
  '/api/influencers/approve/:address',
  auth.authenticate,
  InfluencerController.approveInfluencer
);

// Auth Routes
app.post('/api/auth/signup', auth.isLoggedIn, AuthController.signup);
app.get(
  '/api/auth/nonce/:account_address',
  auth.isLoggedIn,
  AuthController.getNonce
);
app.post('/api/auth/login', auth.isLoggedIn, AuthController.login);

// Users Routes
app.get('/api/users', UserController.getAllUsers);
app.get('/api/users/:account_address', UserController.getUserByAddress);

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
