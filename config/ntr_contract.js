const ntrABI = require('./abis/ntr.json');
const web3 = require('./web3');

const contractAddress = process.env.NTR_CONTRACT_ADDRESS;

const contract = new web3.eth.Contract(ntrABI, `${contractAddress}`);
module.exports = contract;
