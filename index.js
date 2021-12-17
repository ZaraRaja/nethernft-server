const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./Routes/User');
const dotenv = require('dotenv');

/**
 * Environment Configurations.
 */
dotenv.config({ path: './config.env' });
const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Database Connectivity
 */
mongoose.connect(process.env.DATABASE);

const mongodb = mongoose.connection;
mongodb.on('open', () => {
  console.log('DB is Connected');
});

app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cors());
app.use(express.json());
app.use('/api/users', User);
app.use('/api/userfile', User);

/**
 * App middlwares
 */
const launchPadpage = require('./middlewares/launchPadpage');
const influencerUpload = require('./middlewares/influencer.upload');
const uploadMulter = require('./middlewares/upload');

/**
 * App Controllers.
 */
const NFTController = require('./controller/nft');
const UserWalletController = require('./controller/userwallet');
const LaunchpadController = require('./controller/launchpad');
const InfluencerController = require('./controller/influencer');
const UserController = require('./controller/user');
const FileController = require('./controller/file');

/**
 * Primary app routes.
 */
app.post('/api/mint-nft', NFTController.addNft);
app.put('/api/setPrice/:id', NFTController.setPrice);
app.get('/api/getPrice/:id', NFTController.getPrice);
app.get('/api/users/getnfts', NFTController.getAllNFT);
app.put('/api/transferOwnership', NFTController.transferOwnership);
app.post('/api/user-wallet-address', UserWalletController.userWalletAccount);
app.post('/api/users/launchpad', launchPadpage, LaunchpadController.launchpad);
app.post('/api/users/become-influencer', InfluencerController.becomeInfluencer);
app.get(
  '/api/users/influencer/:address',
  InfluencerController.getInfluencerBasedOnAddress
);
app.post(
  '/api/users/influencer/upload-images',
  influencerUpload,
  InfluencerController.uploadInflencerImages
);
app.post('/api/users/approve', UserController.approveInfluencer);
app.post('/api/users/register', UserController.registerUser);
app.post('/api/users/login', UserController.loginUser);
app.get('/api/users/getusers', UserController.getAllUsers);
app.get('/api/users/:id', UserController.getOneUser);
app.get('/api/userfile/getHashFiles', FileController.getHashedOfFiles);
app.post('/api/users/file', uploadMulter, FileController.addFiles);

/**
 * App Listening to the port
 */
app.listen(PORT, () => {
  console.log(`App running on ${PORT}`);
});
