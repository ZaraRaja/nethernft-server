const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./Routes/User');

// using env for secure our personal data/passwords
dotenv.config({ path: './config.env' });

// connecting the database
mongoose.connect(process.env.DATABASE);

const mongodb = mongoose.connection;

// show in the console that db is connected
mongodb.on('open', () => {
  console.log('DB is Connected');
});

app.use('/uploads', express.static('uploads'));
app.use(cors());
app.use(express.json());
app.use('/api/users', User);
app.use('/api/userfile', User);

/**
 * Controllers (route handlers).
 */

const NFTController = require('./controller/nft');

/**
 * Primary app routes.
 */

app.post('/api/mintNft', NFTController.addNft);
app.put('/api/setPrice/:id', NFTController.setPrice);
app.get('/api/getPrice/:id', NFTController.getPrice);
app.get('/api/getAllNft', NFTController.getAllNFT);
app.put('/api/transferOwnership', NFTController.transferOwnership);

// our app listening on defined Port
app.listen(PORT, () => {
  console.log(`App running on ${PORT}`);
});
