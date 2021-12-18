const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const AppError = require('./utils/AppError');
const errorController = require('./controller/error_controller');

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

/**
 * App Controllers.
 */
const AuthController = require('./controller/auth');
const NFTController = require('./controller/nft');
const LaunchpadController = require('./controller/launchpad');
const InfluencerController = require('./controller/influencer');
const UserController = require('./controller/user');
const response_messages = require('./config/response_messages');

/**
 * Primary app routes.
 */

// NFT Routes
app.get('/api/nfts', NFTController.getAllNFTs);
app.post('/api/nfts/mint', NFTController.mint);
app.patch('/api/nfts/price/:id', NFTController.updatePrice);
app.get('/api/nfts/price/:id', NFTController.getPrice);
app.patch('/api/nfts/transfer-ownership', NFTController.transferOwnership);

// Launchpad Routes
app.post('/api/launchpad', launchpadUpload, LaunchpadController.create);

// Influencers Routes
app.post('/api/influencers', InfluencerController.becomeInfluencer);
app.get(
  '/api/influencers/:address',
  InfluencerController.getInfluencerByAddress
);
app.post(
  '/api/influencers/upload-images',
  influencerUpload,
  InfluencerController.uploadInflencerImages
);
app.post(
  '/api/influencers/approve/:address',
  InfluencerController.approveInfluencer
);

// Auth Routes
app.post('/api/auth/signup', AuthController.signup);
app.post('/api/auth/login', AuthController.login);

// Users Routes
app.get('/api/users', UserController.getAllUsers);
app.get('/api/users/:address', UserController.getUserByAddress);

/**
 * Error Handling
 */
app.use((req, res, next) => {
  next(
    new AppError(
      response_messages.URL_NOT_FOUND,
      `The url ${req.originalUrl} does not exist!`,
      404
    )
  );
});

app.use(errorController);

module.exports = app;
