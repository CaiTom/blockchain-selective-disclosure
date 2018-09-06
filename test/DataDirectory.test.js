var DataDirectory = artifacts.require("DataDirectory");

const BigNumber = web3.BigNumber

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should()

contract('Data Directory', function([owner]) {
	var dataDirectory;

	before("deploy DataDirectory", async function() {
		dataDirectory = await DataDirectory.new();
	});


	it("should initially not have any elements", async function() {
		(await dataDirectory.getChildrenCount("root")).should.be.bignumber.equal(0);
	});


	it("should add first root child", async function() {
		await dataDirectory.addElement("root", "Validations", true);

		(await dataDirectory.getChildrenCount("root")).should.be.bignumber.equal(1);
		var childId = await dataDirectory.getChildIdAt("root", 0);
		(await dataDirectory.getFullName(childId)).should.be.equal("Validations");
		(await dataDirectory.isFolder(childId)).should.be.equal(true);
	});


	it("should add second root child", async function() {
		await dataDirectory.addElement("root", "Donations", true);

		(await dataDirectory.getChildrenCount("root")).should.be.bignumber.equal(2);
		var childId = await dataDirectory.getChildIdAt("root", 1);
		(await dataDirectory.getFullName(childId)).should.be.equal("Donations");
		(await dataDirectory.isFolder(childId)).should.be.equal(true);
	});


	it("should add third root child", async function() {
		await dataDirectory.addElement("root", "Outcomes", true);

		(await dataDirectory.getChildrenCount("root")).should.be.bignumber.equal(3);
		var childId = await dataDirectory.getChildIdAt("root", 2);
		(await dataDirectory.getFullName(childId)).should.be.equal("Outcomes");
		(await dataDirectory.isFolder(childId)).should.be.equal(true);
	});

	it("should add file in the first folder", async function () {
		var firstFolder = await dataDirectory.getChildIdAt("root", 0);
		var fileHash = "QmcMSVZLudd5LV3ZGzopSmfAJVXCdeQh34V86nqqDJhWmu";
		var userId = "0x6a007fef46433b8f42b284da83c5f7e4ef99f050";
		await dataDirectory.addFile(firstFolder, "truffle.js", userId, fileHash);
		var fileId = await dataDirectory.getChildIdAt(firstFolder, 0);
		(await dataDirectory.getFullName(fileId)).should.be.equal("truffle.js");
		(await dataDirectory.isFolder(fileId)).should.be.equal(false);
		(await dataDirectory.getFileHash(fileId, userId)).should.be.equal(fileHash);
	});

	it("should add another hash for different user", async function () {
		var firstFolder = await dataDirectory.getChildIdAt("root", 0);
		var fileId = await dataDirectory.getChildIdAt(firstFolder, 0);
		var BobId = "0x2a43de76e4aa68ff5f7815e8eb608f9cadca3096";
		var anotherHash = "QmfRLQWpu9tjrgX4p9nJHEWLxzdMqBQZDnxVnwYPPPEjNK";
		await dataDirectory.addFileHash("truffle.js", BobId, anotherHash);
		(await dataDirectory.getFileHash(fileId, BobId)).should.be.equal(anotherHash);
	});

});
