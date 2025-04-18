module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Match Ganache GUI port
      network_id: "5777",    // Match Ganache network id
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",     // Match Solidity version used in EHR.sol
    }
  }
};
