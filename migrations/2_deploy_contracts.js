var DataDirectory = artifacts.require("./DataDirectory.sol");
var UsersDirectory = artifacts.require("./UsersDirectory.sol");
var DataAccess = artifacts.require("./DataAccess.sol");

module.exports = function(deployer, network, accounts) {
	deployer.deploy(DataDirectory).then(function () {
		return deployer.deploy(UsersDirectory);
	}).then(function () {
		return deployer.deploy(DataAccess, DataDirectory.address, UsersDirectory.address);
	});
	
}