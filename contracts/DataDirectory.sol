pragma solidity ^0.4.23; // Compatible version

// devDependency
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

// Inheritence from Ownable
contract DataDirectory is Ownable {

    event AddedElement(address user, bytes32 parentId, string fullName);
    event AddedHash(address user, string fullName, string hash);

    // Defines a folder
    struct Element {
        bytes32 parentId; // Parent folder
        // bytes reference;  // What is this? The address of the file?
        mapping (address => string) fileHashes;
        string fullName;  // Folder name
        bool isFolder;	  // Why not? When it is a file?
        bytes32[] children;  // Will be added in addElement()
    }

    // Access all directories via ID
    mapping (bytes32 => Element) public elements;
    // Count what?
    uint256 count;

    // When constructed, only create root folder
    constructor() public {
        elements["root"].parentId = 0x1;
    }

    // The elementId is the keccak hash of the folder name. But what is related to parentID?
    function getElementId(bytes32 parentId, string fullName) public pure returns(bytes32) {
        return keccak256(abi.encodePacked(fullName));
    }

    // Once this contract is deployed, more directories can be added into it
    // But it seems every one can add elements?
    function addElement(bytes32 parentId, string fullName, bool isFolder) public {
        bytes32 id = this.getElementId(parentId, fullName);
        require(elements[id].parentId == 0);
        elements[id].parentId = parentId;
        elements[id].fullName = fullName;
        elements[id].isFolder = isFolder;
        elements[parentId].children.push(id);
        emit AddedElement(msg.sender, parentId, fullName); 
    }

    function addFile(bytes32 parentId, string fullName, address user, string fileHash) public {
    	bytes32 id = this.getElementId(parentId, fullName);
    	require(elements[id].parentId == 0);
    	elements[id].parentId = parentId;
    	elements[id].fullName = fullName;
    	elements[id].isFolder = false;
    	elements[parentId].children.push(id);
    	elements[id].fileHashes[user] = fileHash;
    	emit AddedElement(user, parentId, fullName);
        emit AddedHash(user, fullName, fileHash);
    }

    function addFileHash(string fullName, address user, string fileHash) public {
        bytes32 id = keccak256(abi.encodePacked(fullName));
        require(elements[id].parentId != 0);
        elements[id].fileHashes[user] = fileHash;
        emit AddedHash(msg.sender, fullName, fileHash);
    }

    function getFileHash(bytes32 elementId, address user) public view returns(string) {
        return elements[elementId].fileHashes[user];
    }

    // Get the number of children
    function getChildrenCount(bytes32 elementId) public view returns(uint256) {
        return elements[elementId].children.length;
    }

    // See if it is folder
    function isFolder(bytes32 elementId) public view returns(bool) {
        return elements[elementId].isFolder;
    }

    // get the name of the folder
    function getFullName(bytes32 elementId) public view returns(string) {
        return elements[elementId].fullName;
    }

    // Get the index-th child ID of the folder of elementID
    function getChildIdAt(bytes32 elementId, uint256 index) public view returns(bytes32) {
        return elements[elementId].children[index];
    }

    // Get the parent folder ID
    function getParentId(bytes32 elementId) public view returns(bytes32) {
        return elements[elementId].parentId;
    }

    // The root folder does not has parent
    function hasParent(bytes32 elementId) public view returns(bool) {
        return getParentId(elementId) != 0x1;
    }

}