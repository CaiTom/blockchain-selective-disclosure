var UsersDirectory = artifacts.require("UsersDirectory");

const BigNumber = web3.BigNumber

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should()

contract('UsersDirectory', function([owner, user]) {
	var usersDirectory;

	before("deploy UsersDirectory", async function() {
		usersDirectory = await UsersDirectory.new();
	});


	it("should initially not have any elements", async function() {
		(await usersDirectory.getChildrenCount("root-users")).should.be.bignumber.equal(0);
	});


	it("should add first root child", async function() {
		await usersDirectory.addElement("root-users", "Judges");

		(await usersDirectory.getChildrenCount("root-users")).should.be.bignumber.equal(1);
		var childId = await usersDirectory.getChildIdAt("root-users", 0);
		(await usersDirectory.getFullName(childId)).should.be.equal("Judges");
	});


	it("should add second root child", async function() {
		await usersDirectory.addElement("root-users", "Donors");

		(await usersDirectory.getChildrenCount("root-users")).should.be.bignumber.equal(2);
		var childId = await usersDirectory.getChildIdAt("root-users", 1);
		(await usersDirectory.getFullName(childId)).should.be.equal("Donors");
	});


	it("should add user", async function() {
		await usersDirectory.addUser("root-users", user);

		(await usersDirectory.getUsersCount("root-users")).should.be.bignumber.equal(1);
		(await usersDirectory.getUserAt("root-users", 0)).should.be.equal(user);
	});

	it("should add user to different folder", async function () {
		var groupId = await usersDirectory.getChildIdAt("root-users", 1);
		var userGroup;
		await usersDirectory.addUser(groupId, user);
		(await usersDirectory.getUsersCount(groupId)).should.be.bignumber.equal(1);
		(await usersDirectory.getUserAt(groupId, 0)).should.be.equal(user);
		userGroup = await usersDirectory.getUserGroup(user);
		(userGroup.length).should.be.equal(2);
		userGroup[1].should.be.equal(groupId);
	})

});
