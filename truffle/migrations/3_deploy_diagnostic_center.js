const EHR = artifacts.require("EHR");
const DiagnosticCenter = artifacts.require("DiagnosticCenter");

module.exports = async function (deployer, network, accounts) {
  // Use the address of your already deployed EHR contract
  const deployedEHR = await EHR.deployed(); // OR manually provide if already deployed
  const ehrAddress = deployedEHR.address; // Or: const ehrAddress = "0x123...abc";

  await deployer.deploy(DiagnosticCenter, ehrAddress);
};
