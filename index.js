const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./Routes/User');
// Controllers (route handlers).
const NFTController = require('./controller/nft');
const UserWalletController = require('./controller/userwallet');
const dotenv = require('dotenv');
// using env for secure our personal data/passwords
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// connecting the database
mongoose.connect(process.env.DATABASE);

const mongodb = mongoose.connection;

// show in the console that db is connected
mongodb.on('open', () => {
  console.log('DB is Connected');
});

app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cors());
app.use(express.json());
app.use('/api/users', User);
app.use('/api/userfile', User);

// Primary app routes.
app.post('/api/mintNft', NFTController.addNft);
app.put('/api/setPrice/:id', NFTController.setPrice);
app.get('/api/getPrice/:id', NFTController.getPrice);
app.get('/api/getAllNft', NFTController.getAllNFT);
app.put('/api/transferOwnership', NFTController.transferOwnership);
app.post('/api/userWalletAddress', UserWalletController.userWalletAccount);
// our app listening on defined Port
app.listen(PORT, () => {
  console.log(`App running on ${PORT}`);
});
