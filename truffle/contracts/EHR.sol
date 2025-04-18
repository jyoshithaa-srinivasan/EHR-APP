// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EHR {
    struct Record {
        string ipfsHash;
        string category;
        uint256 timestamp;
    }

    struct Patient {
        address addr;
        Record[] records;
        mapping(address => uint[]) recordAccess; // doctor => array of record indices
        address[] authorizedDoctors;
        mapping(address => bool) isDoctorListed; // to avoid duplicates
    }

    mapping(address => Patient) private patients;
    mapping(address => string) public roles;

    address[] public patientAddresses;

    modifier onlyPatient() {
        require(keccak256(bytes(roles[msg.sender])) == keccak256("patient"), "Only patients allowed");
        _;
    }

    function register(string memory role) public {
        require(bytes(roles[msg.sender]).length == 0, "Already registered");
        roles[msg.sender] = role;

        if (keccak256(bytes(role)) == keccak256("patient")) {
            patients[msg.sender].addr = msg.sender;
            patientAddresses.push(msg.sender);
        }
    }

    function addRecord(string memory ipfsHash, string memory category) public onlyPatient {
        Record memory newRecord = Record(ipfsHash, category, block.timestamp);
        patients[msg.sender].records.push(newRecord);
    }

    // ✅ Grant access to a specific record
    function giveAccessToDoctor(address doctor, uint recordIndex) public onlyPatient {
        require(recordIndex < patients[msg.sender].records.length, "Invalid record index");
        patients[msg.sender].recordAccess[doctor].push(recordIndex);

        // Add doctor to authorizedDoctors list once
        if (!patients[msg.sender].isDoctorListed[doctor]) {
            patients[msg.sender].authorizedDoctors.push(doctor);
            patients[msg.sender].isDoctorListed[doctor] = true;
        }
    }

    function getRecords(address patientAddr) public view returns (Record[] memory) {
        require(
            msg.sender == patientAddr || isAuthorizedForAny(patientAddr, msg.sender),
            "Not authorized"
        );
        return patients[patientAddr].records;
    }

    // ✅ Modified to return only granted records
    function getAccessibleRecords()
        public
        view
        returns (
            address[] memory,
            string[] memory,
            string[] memory,
            uint256[] memory
        )
    {
        uint total = 0;

        // First count total accessible records
        for (uint i = 0; i < patientAddresses.length; i++) {
            uint[] memory indices = patients[patientAddresses[i]].recordAccess[msg.sender];
            total += indices.length;
        }

        address[] memory patientList = new address[](total);
        string[] memory ipfsHashes = new string[](total);
        string[] memory categories = new string[](total);
        uint256[] memory timestamps = new uint256[](total);

        uint index = 0;
        for (uint i = 0; i < patientAddresses.length; i++) {
            address patient = patientAddresses[i];
            uint[] memory indices = patients[patient].recordAccess[msg.sender];

            for (uint j = 0; j < indices.length; j++) {
                Record memory rec = patients[patient].records[indices[j]];
                patientList[index] = patient;
                ipfsHashes[index] = rec.ipfsHash;
                categories[index] = rec.category;
                timestamps[index] = rec.timestamp;
                index++;
            }
        }

        return (patientList, ipfsHashes, categories, timestamps);
    }

    // View if the doctor has access to any record from patient
    function isAuthorizedForAny(address patient, address doctor) public view returns (bool) {
        return patients[patient].recordAccess[doctor].length > 0;
    }

    function getAllPatients() public view returns (address[] memory) {
        return patientAddresses;
    }

    function getRole(address user) public view returns (string memory) {
        return roles[user];
    }

    // ✅ View accessible record indices (for frontend filtering if needed)
    function getAccessibleRecordIndices(address patient) public view returns (uint[] memory) {
        return patients[patient].recordAccess[msg.sender];
    }
}
