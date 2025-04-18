const Web3 = require("web3");
const diagnosticAbi = require("../../truffle/build/contracts/DiagnosticCenter.json");

const contractAddress = process.env.DIAGNOSTIC_CONTRACT_ADDRESS;

// Set up Web3 provider and signer
const web3 = new Web3(process.env.RPC_URL); // Assuming RPC_URL is set to Ganache's URL
const contract = new web3.eth.Contract(diagnosticAbi.abi, contractAddress);

// Function to upload a report
async function uploadReport(fromWallet, patientAddress, ipfsHash, category) {
  const data = contract.methods.uploadDiagnosticReport(patientAddress, ipfsHash, category).encodeABI();
  const tx = {
    from: fromWallet,
    to: contractAddress,
    data: data,
    gas: 2000000, // Ensure sufficient gas limit
  };

  // Sign the transaction
  const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY);

  // Send the transaction
  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  return receipt.transactionHash;
}

// Function to get reports for a patient
async function getReports(patientAddress) {
  const reports = await contract.methods.getDiagnosticReports(patientAddress).call();
  return reports.map((hash, i) => ({
    ipfsHash: hash,
    category: reports[1][i], // Categories are returned in the second array
    timestamp: Number(reports[2][i]), // Timestamps in the third array
  }));
}

async function getPatientsWhoGrantedAccess(centerAddress) {
  const patients = await contract.methods.getPatientsWhoGrantedAccess().call({ from: centerAddress });
  return patients;
}

module.exports = {
  uploadReport,
  getReports,
  getPatientsWhoGrantedAccess,
};
