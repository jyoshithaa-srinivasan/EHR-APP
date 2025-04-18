// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./EHR.sol"; // Ensure EHR.sol has getRole and getAllPatients functions

contract DiagnosticCenter {
    EHR private ehrContract;

    struct DiagnosticReport {
        string ipfsHash;
        string category;
        uint256 timestamp;
    }

    // Mapping of patient => diagnostic center => access status
    mapping(address => mapping(address => bool)) private accessGranted;

    // Mapping of patient => array of diagnostic reports
    mapping(address => DiagnosticReport[]) private diagnosticReports;

    event DiagnosticReportUploaded(address indexed patient, string ipfsHash, string category, uint256 timestamp);
    event DiagnosticCenterAccessGranted(address indexed patient, address indexed diagnosticCenter);

    modifier onlyPatient() {
        require(
            keccak256(bytes(ehrContract.getRole(msg.sender))) == keccak256("patient"),
            "Only patients allowed"
        );
        _;
    }

    constructor(address _ehrContractAddress) {
        ehrContract = EHR(_ehrContractAddress);
    }

    // Patient grants access to a diagnostic center
    function grantAccessToDiagnosticCenter(address diagnosticCenter) public onlyPatient {
        require(diagnosticCenter != address(0), "Invalid diagnostic center address");
        require(!accessGranted[msg.sender][diagnosticCenter], "Access already granted");

        accessGranted[msg.sender][diagnosticCenter] = true;
        emit DiagnosticCenterAccessGranted(msg.sender, diagnosticCenter);
    }

    // Diagnostic center uploads a report for a patient
    function uploadDiagnosticReport(address patient, string memory ipfsHash, string memory category) public {
        require(
            keccak256(bytes(ehrContract.getRole(patient))) == keccak256("patient"),
            "Invalid patient address"
        );
        require(accessGranted[patient][msg.sender], "Access not granted by patient");

        DiagnosticReport memory newReport = DiagnosticReport(ipfsHash, category, block.timestamp);
        diagnosticReports[patient].push(newReport);

        emit DiagnosticReportUploaded(patient, ipfsHash, category, block.timestamp);
    }

    // Patient views their own diagnostic reports
    function getMyDiagnosticReports() public view onlyPatient returns (string[] memory, string[] memory, uint256[] memory) {
        DiagnosticReport[] storage reports = diagnosticReports[msg.sender];
        uint256 totalReports = reports.length;

        string[] memory ipfsHashes = new string[](totalReports);
        string[] memory categories = new string[](totalReports);
        uint256[] memory timestamps = new uint256[](totalReports);

        for (uint256 i = 0; i < totalReports; i++) {
            ipfsHashes[i] = reports[i].ipfsHash;
            categories[i] = reports[i].category;
            timestamps[i] = reports[i].timestamp;
        }

        return (ipfsHashes, categories, timestamps);
    }

    // Diagnostic center gets all patients who granted access to them
    function getPatientsWhoGrantedAccess() public view returns (address[] memory) {
        address[] memory allPatients = ehrContract.getAllPatients();
        uint256 count = 0;

        // First, count how many patients granted access
        for (uint256 i = 0; i < allPatients.length; i++) {
            if (accessGranted[allPatients[i]][msg.sender]) {
                count++;
            }
        }

        // Now create the array of those patients
        address[] memory grantedPatients = new address[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < allPatients.length; i++) {
            if (accessGranted[allPatients[i]][msg.sender]) {
                grantedPatients[index] = allPatients[i];
                index++;
            }
        }

        return grantedPatients;
    }

    // View diagnostic reports for a specific patient (only if access granted)
    function getReportsForPatient(address patient) public view returns (string[] memory, string[] memory, uint256[] memory) {
        require(accessGranted[patient][msg.sender], "Not authorized by this patient");

        DiagnosticReport[] storage reports = diagnosticReports[patient];
        uint256 totalReports = reports.length;

        string[] memory ipfsHashes = new string[](totalReports);
        string[] memory categories = new string[](totalReports);
        uint256[] memory timestamps = new uint256[](totalReports);

        for (uint256 i = 0; i < totalReports; i++) {
            ipfsHashes[i] = reports[i].ipfsHash;
            categories[i] = reports[i].category;
            timestamps[i] = reports[i].timestamp;
        }

        return (ipfsHashes, categories, timestamps);
    }

    // Check if a specific diagnostic center is authorized by a patient
    function isDiagnosticCenterAuthorized(address patient, address center) public view returns (bool) {
        return accessGranted[patient][center];
    }

   function hasDiagnosticAccess(address patient, address diagnosticCenter) public view returns (bool) {
    return accessGranted[patient][diagnosticCenter];
}


}
