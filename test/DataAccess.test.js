var DataAccess = artifacts.require("DataAccess");
var DataDirectory = artifacts.require("DataDirectory");
var UsersDirectory = artifacts.require("UsersDirectory");

const BigNumber = web3.BigNumber

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should()

contract('Data Access', function([owner]) {
	var dataAccess, dataDirectory, usersDirectory;
	var childId;

	before("deploy DataAccess", async function() {
		dataDirectory = await DataDirectory.new();
		usersDirectory = await UsersDirectory.new();
		dataAccess = await DataAccess.new(dataDirectory.address, usersDirectory.address);
	});


	it("should grant access", async function() {
		await dataAccess.changeAccess("directory", "group", true, true, true);

		var access = await dataAccess.checkAccess("directory", "group");

		(access).should.be.deep.equal([true, true, true]);
	});


	it("should revoke access", async function() {
		await dataAccess.changeAccess("directory", "group", false, false, false);

		var access = await dataAccess.checkAccess("directory", "group");

		(access).should.be.deep.equal([false, false, false]);
	});


	it("should check recursive access", async function() {
		await dataDirectory.addElement("root", "child", true);
		childId = await dataDirectory.getElementId("root", "child");

		await dataAccess.changeAccess("root", "group", true, true, false);

		var access = await dataAccess.recursivelyCheckAccess(childId, "group");
		(access).should.be.deep.equal([true, true, false]);
	});


	it("should check recursive access and merge", async function() {
		await dataDirectory.addElement(childId, "grand-child", true);
		var grandChildId = await dataDirectory.getElementId(childId, "grand-child");


		await dataAccess.changeAccess("root", "group", true, false, false);
		await dataAccess.changeAccess(childId, "group", false, true, false);

		var access = await dataAccess.recursivelyCheckAccess(grandChildId, "group");

		(access).should.be.deep.equal([true, true, false]);
	});


	it("should return empty access for not existing entry", async function() {
		var access = await dataAccess.checkAccess("void", "unknown");

		(access).should.be.deep.equal([false, false, false]);
	});

	it("should check creator", async function () {
		var AliceId = "0x6a007fef46433b8f42b284da83c5f7e4ef99f050";
		var BobId = "0x2a43de76e4aa68ff5f7815e8eb608f9cadca3096";
		var AliceData, BobData;

		await dataDirectory.addElement("root", "AliceData", true);
		AliceData = await dataDirectory.getElementId("root", "AliceData");
		await dataAccess.addCreator(AliceData, AliceId);

		await dataDirectory.addElement("root", "BobData", true);
		BobData = await dataDirectory.getElementId("root", "BobData");
		await dataAccess.addCreator(BobData, BobId);

		(await dataAccess.isCreator(AliceData, AliceId)).should.be.equal(true);
		(await dataAccess.isCreator(BobData, BobId)).should.be.equal(true);
	});

	it("should check user access", async function () {
		var AliceId = "0x6a007fef46433b8f42b284da83c5f7e4ef99f050";
		var BobId = "0x2a43de76e4aa68ff5f7815e8eb608f9cadca3096";
		var groupId, AliceData, BobData, FolderOne, FolderTwo;
		var access;

		await usersDirectory.addElement("root-users", "firstGroup");
		groupId = await usersDirectory.getElementId("root-users", "firstGroup");
		await usersDirectory.addUser(groupId, AliceId);

		AliceData = await dataDirectory.getElementId("root", "AliceData");
		BobData = await dataDirectory.getElementId("root", "BobData");

		await dataDirectory.addElement(BobData, "FolderOne", true);
		FolderOne = await dataDirectory.getElementId(BobData, "FolderOne");
		await dataAccess.addCreator(FolderOne, BobId);
		await dataDirectory.addElement(BobData, "FolderTwo", true);
		FolderTwo = await dataDirectory.getElementId(BobData, "FolderTwo");
		await dataAccess.addCreator(FolderTwo, BobId);

		access = await dataAccess.checkUserAccess(AliceData, AliceId);
		(access).should.be.deep.equal([false, false, true]);
		access = await dataAccess.checkUserAccess(AliceData, BobId);
		(access).should.be.deep.equal([false, false, false]);
		access = await dataAccess.checkUserAccess(FolderOne, AliceId);
		(access).should.be.deep.equal([false, false, false]);

		await dataAccess.changeAccess(FolderOne, groupId, false, true, false);
		access = await dataAccess.checkUserAccess(FolderOne, AliceId);
		(access).should.be.deep.equal([false, true, false]);
		access = await dataAccess.checkReadAccess(FolderOne, AliceId);
		(access[0]).should.be.deep.equal(true);
		access = await dataAccess.checkReadAccess(BobData, AliceId);
		(access[0]).should.be.deep.equal(true);


	});

});
