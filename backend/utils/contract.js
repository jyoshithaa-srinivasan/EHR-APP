const Web3 = require("web3");
// const { Web3 } = require('web3');

const contractABI = require("../../truffle/build/contracts/EHR.json").abi;
const contractAddress = "0x631Cf8fa59eF988ae6D285dc1A57c1c3ec9CA998";

const getWeb3 = () => {
  const web3 = new Web3("http://localhost:7545");
  web3.eth.handleRevert = true; // Enable detailed revert reasons
  return web3;
};
const getContract = async (web3) => {
  return new web3.eth.Contract(contractABI, contractAddress);
};

module.exports = { getWeb3, getContract };

// Replace "0xYourContractAddress" with the actual deployed address from Truffle.

