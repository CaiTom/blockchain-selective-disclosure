pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './DataDirectory.sol';
import './UsersDirectory.sol';


contract DataAccess is Ownable {

    event AccessChanged(bytes32 folder, bytes32 group, bool read, bool write, bool admin, uint256 created, uint256 expires);
    event CreatorAdded(bytes32 dir, address user);

    DataDirectory dataDirectory;
    UsersDirectory usersDirectory;

    constructor(DataDirectory _dataDirectory, UsersDirectory _usersDirectory) public {
        dataDirectory = _dataDirectory;
        usersDirectory = _usersDirectory;
    }

    struct Access {
        bool read;
        bool write;
        bool admin;
        uint256 created;
        uint256 expires;
    }

    // Access = rights[folder][group]
    mapping (bytes32 => mapping(bytes32 => Access)) public rights;
    mapping (bytes32 => mapping(address => bool)) public creator; // Creator has admin right
    uint256 count;

    // change the state of Acess. Everyone can change it?
    function changeAccess(bytes32 folder, bytes32 group, bool read, bool write, bool admin) public {
        rights[folder][group] = Access(read, write, admin, now, 0); // Currently no expire date
        emit AccessChanged(folder, group,read, write, admin, now, 0);
    }

    function addCreator(bytes32 dir, address user) public {
        creator[dir][user] = true;
        emit CreatorAdded(dir, user);
    }

    function isCreator(bytes32 dir, address user) public view returns(bool) {
        return creator[dir][user];
    }

    // get the Access from rights
    function checkAccess(bytes32 folder, bytes32 group) public view returns(bool[3]) {
        Access memory access = rights[folder][group];
        return [access.read, access.write, access.admin];
    }

    // Check the access for a certain user
    function checkUserAccess(bytes32 dir, address user) public view returns(bool[3]) {
        bool[3] memory currentAccess = [false, false, false];
        if (isCreator(dir, user)) {
            currentAccess[2] = true;
        }
        bytes32[] memory belongToGroup = usersDirectory.getUserGroup(user);
        // Loop over all the groups the user belongs to
        for(uint256 i=0; i<belongToGroup.length; i++) {
            bool[3] memory groupAccess = checkAccess(dir, belongToGroup[i]);
            currentAccess[0] = currentAccess[0] || groupAccess[0];
            currentAccess[1] = currentAccess[1] || groupAccess[1];
            currentAccess[2] = currentAccess[2] || groupAccess[2];
        }
        return currentAccess;
    }

    // If parent has access, then this will also has access
    function recursivelyCheckAccess(bytes32 folder, bytes32 group) public view returns(bool[3]) {
        bool[3] memory currentAccess = checkAccess(folder, group);
        if (dataDirectory.hasParent(folder)) {
            bytes32 parentFolder = dataDirectory.getParentId(folder);
            bool[3] memory parentAccess = recursivelyCheckAccess(parentFolder, group);
            return [currentAccess[0] || parentAccess[0], currentAccess[1] || parentAccess[1], currentAccess[2] || parentAccess[2]];
        } else {
            return currentAccess;
        }
    }

    // Check if a directory is visible to the user //////// Only the first element is used
    function checkReadAccess(bytes32 dir, address user) public view returns(bool[3]) {
        bool[3] memory currentAccess = checkUserAccess(dir, user);
        currentAccess[0] = currentAccess[0] || currentAccess[1] || currentAccess[2];
        uint256 childrenCount = dataDirectory.getChildrenCount(dir);
        for (uint256 i=0; i<childrenCount; i++) {
            bytes32 childDir = dataDirectory.getChildIdAt(dir, i);
            bool[3] memory childAccess = checkReadAccess(childDir, user);
            // If one has any access to child directory, then he can "read" its parent folder name
            currentAccess[0] = currentAccess[0] || childAccess[0] || childAccess[1] || childAccess[2];
        }
        return currentAccess;
    }
}