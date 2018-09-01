// Import the page's CSS. Webpack will know what to do with it.
import "./stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import dataDirectory_artifacts from '../build/contracts/DataDirectory.json';
import usersDirectory_artifacts from '../build/contracts/UsersDirectory.json';
import dataAccess_artifacts from '../build/contracts/DataAccess.json';
import kovan_deployment from './kovan-deployment.json';
var fs = require('fs');
// Create contract object
var DataDirectory = contract(dataDirectory_artifacts);
var UsersDirectory = contract(usersDirectory_artifacts);
var DataAccess = contract(dataAccess_artifacts);

// Contract instance
var dataDirectory;
var usersDirectory;
var dataAccess;


//Accounts
var mainAccount;
var selectedFolderId;
var events;

// If this is empty, then deployDataDirectory
function getContractAddress(name) {
	return kovan_deployment[name];
}

// When the contract is not deployed
async function deployDataDirectory() {
	// Create instance
	dataDirectory = await DataDirectory.new({from: mainAccount, gas: 2000000});
	// instance address
	console.log("Deployed data directory: " + dataDirectory.address);
	// ?
	localStorage.setItem('dataDirectoryAddress', dataDirectory.address);
	// Add three folders
	await dataDirectory.addElement("root", "Validations", true, {from: mainAccount, gas: 2000000});
	await dataDirectory.addElement("root", "Donations", true, {from: mainAccount, gas: 2000000});
	// Get the id of the first folder
	var donationsId = await dataDirectory.getElementId("root", "Validations");
	// Add two sub folders in the first folder
	await dataDirectory.addElement(donationsId, "St. Mungos", true, {from: mainAccount, gas: 2000000});
	
	await dataDirectory.addElement(donationsId, "Fusion Housing", true, {from: mainAccount, gas: 2000000});
}

// When the userDirectory contract is not deployed
async function deployUsersDirectory() {
	// Create instance
	usersDirectory = await UsersDirectory.new({from: mainAccount, gas: 2000000});
	// print instance address
	console.log("Deployed users directory: " + usersDirectory.address);
	// 
	localStorage.setItem('usersDirectoryAddress', usersDirectory.address);
	// add three folders for users
	await usersDirectory.addElement("root-users", "Project Managers", {from: mainAccount, gas: 2000000});
	await usersDirectory.addElement("root-users", "Judges", {from: mainAccount, gas: 2000000});
	await usersDirectory.addElement("root-users", "Donors", {from: mainAccount, gas: 2000000});
}

// Similar to above
async function deployDataAccess() {
	dataAccess = await DataAccess.new(dataDirectory.address, usersDirectory.address, {from: mainAccount, gas: 2000000});
	console.log("Deployed dataAccess: " + dataAccess.address);
	localStorage.setItem('dataAccessAddress', dataAccess.address);
	var donationsId = await dataDirectory.getElementId("root", "Validations");
	await dataAccess.addCreator(donationsId, mainAccount, {from: mainAccount, gas: 2000000})
	var mungosId = await dataDirectory.getElementId(donationsId, "St. Mungos");
	await dataAccess.addCreator(mungosId, mainAccount, {from: mainAccount, gas: 2000000})
	
}

// When click add button. Get parentId, fullName from the input box
async function addDataElement(parentId, fullName) {
	console.log("Adding: " + fullName + " to parent: " + parentId);
	$.busyLoadFull("show");
	await dataDirectory.addElement(parentId, fullName, true, {from: mainAccount, gas: 2000000});
	var elementId = await dataDirectory.getElementId(parentId, fullName);
	//////////////////await dataAccess.addCreator(elementId, mainAccount, {from: mainAccount, gas: 2000000})
	$.busyLoadFull("hide");
	var elementId = await dataDirectory.getElementId(parentId, fullName);
	addDataDirectoryFolder(parentId, fullName, elementId);
	listenToEvents();
};

async function addDataFile(parentId, fullName, mainAccount, hashValue) {
	console.log("Adding: " + fullName + " to parent: " + parentId);
	$.busyLoadFull("show");
	await dataDirectory.addFile(parentId, fullName, mainAccount, parentId, {from: mainAccount, gas: 2000000});
	var elementId = await dataDirectory.getElementId(parentId, fullName);
	//////////////////await dataDirectory.addElement(parentId, fullName, false, {from: mainAccount, gas: 2000000});
	//////////////////await dataDirectory.addFileHash(fullName, mainAccount, hashValue, {from: mainAccount, gas: 2000000})
	//////////////////await dataAccess.addCreator(elementId, mainAccount, {from: mainAccount, gas: 2000000})
	$.busyLoadFull("hide");
	addDataDirectoryFolder(parentId, fullName, elementId);
	listenToEvents();
}

// Similar to above
async function addUserElement(parentId, address) {
	console.log("Adding user: " + address + " to parent: " + parentId);
	$.busyLoadFull("show");
	await usersDirectory.addUser(parentId, address, {from: mainAccount, gas: 2000000});
	$.busyLoadFull("hide");
	addDirectoryElement(parentId, address);
	listenToEvents();
};

// I added this
async function addGroupElement(parentId, fullName) {
	console.log("Adding user: " + fullName + " to parent: " + parentId);
	$.busyLoadFull("show");
	await usersDirectory.addElement(parentId, fullName, {from: mainAccount, gas: 2000000});
	$.busyLoadFull("hide");
	var elementId = await usersDirectory.getElementId(parentId, fullName);
	addUserDirectoryFolder(parentId, fullName, elementId);
	listenToEvents(); // added
};

// triggered when click grantAccess button
async function grantAccess(folder, group, read, write, admin) {
	///////////////////var userAccess = await dataAccess.checkUserAccess(folder, mainAccount);
	///////////////////if (userAccess[2] == false){
	///////////////////	alert('You are not admin of this folder!');
	///////////////////	return
	///////////////////}
	var pastAccess = await dataAccess.checkAccess(folder, group);
	$.busyLoadFull("show");
	await dataAccess.changeAccess(folder, group, read, write, admin, {from: mainAccount, gas: 2000000});
	$.busyLoadFull("hide");
	// Get the folder name from the selection box
	var folderName = $("#currentFolder").val();
	// Get the group name from the selection box
	var groupName = $('#selectedGroup').find(":selected").text();
	// Show the sentence on the webpage
	M.toast({html: "Access granted for: " + folderName + " to: " + groupName + " [ read: " + read + " write: " + write + " admin: " + admin + " ]"})
	///////// var isFile = await dataDirectory.isFolder(folder);
	////////// if (isFile == true && pastAccess[0] == false && read == true) {
	///////// 	await groupReencrypt(mainAccount, folder, group)
	/////////// }
	////////// 这里其实还要更麻烦，因为当这个group添加成员时也要reencrypt，这里就先不考虑了
}
// /
// // /
// // // async function peerReencrypt(user, dir, peerAddress) {
// // // 	var fileHash = await dataDirectory.getFileHash(dir, mainAccount)
// // // 	var newHash;
// // // 	$.get('http://localhost:3000/', {'id':mainAccount, 'path':fileHash, 'third':peerAddress}, function(data, status) {
// // // 		console.log(data);
// // // 		console.log(status);
// // // 		newHash = data;
// // // 		var fullName = await dataDirectory.getFullName(dir);
// // // 		await dataDirectory.addFileHash(fullName, peerAddress, newHash);
// // // 	})
// // // }

// // // async function groupReencrypt(user, dir, group) {
// // // 	var count = await usersDirectory.getUsersCount(group);
// // // 	for (var i = count - 1; i >= 0; i--) {
// // // 		peerAddress = await usersDirectory.getUserAt(group, i);
// // // 		await peerReencrypt(user, dir, peerAddress);
// // // 	}
// // // }

// async function decryptRe(fileHash) {
// // // // 	$.get('http://localhost:3000/', {'id':mainAccount, 'path':fileHash, 'third':'decrypt_re'}, function(data, status) {
// // // // 		console.log(data);
// // // // 		console.log(status);
// // // // 	})

// }

// Recursively get the whole data folders, start from 'root'
// Contract and displayFunc are dataDirectory and window.addDataDirectoryFolder
async function fetchDirectory(contract, displayFunc, elementId, parentId) {
	// If parentID is not none
	if (parentId) {
		////////////////////var readable = await dataAccess.checkReadAccess(elementId, mainAccount)
		////////////////////if (readable == false && elementId != 'root'){
		////////////////////	return
		////////////////////}
		var fullName = await contract.getFullName(elementId);
		// Display the folder in the webpage
		// if (dataAccess.checkAccess(elementId, )) ///////////////////
		////////////////////var userAccess = await dataAccess.checkUserAccess(elementId, mainAccount)
		////////////////////if (userAccess[1] == false){
		////////////////////	addReadOnlyDirectory(parentId, fullName, elementId);
		////////////////////} else {
			displayFunc(parentId, fullName, elementId);
		////////////////////}

	}
	// Then look after the child folders
	var childCount = await contract.getChildrenCount(elementId);
	for(var i=0; i<childCount.valueOf(); i++) {
		var childId = await contract.getChildIdAt(elementId, i);
		fetchDirectory(contract, displayFunc, childId, elementId);
	}
}


// 其实这个也要检查权限的，只是复杂很多，暂时不考虑
async function fetchUsersDirectory(elementId, parentId) {
	if (parentId) {
		var fullName = await usersDirectory.getFullName(elementId);
		addUserDirectoryFolder(parentId, fullName, elementId);
		// var parent2 = $('#directory' );
		// parent2.append('<button>sss</button>')
	}
	var childCount = await usersDirectory.getChildrenCount(elementId);
	for(var i=0; i<childCount.valueOf(); i++) {
		var childId = await usersDirectory.getChildIdAt(elementId, i);
		fetchUsersDirectory(childId, elementId);
	}
	// This is not folders but users
	var usersCount = await usersDirectory.getUsersCount(elementId);
	for(var i=0; i<usersCount.valueOf(); i++) {
		var address = await usersDirectory.getUserAt(elementId, i);
		addDirectoryElement(elementId, address);
	}
}


// Find the dataDirectory on the blockchain and read it
async function getDataDirectory() {
	var address = getContractAddress('dataDirectoryAddress');
	// If the address does not exists
	if (address) {
		dataDirectory = await DataDirectory.at(address);
	} else {
		await deployDataDirectory();
	}
	// Recursively fetch it from root
	await fetchDirectory(dataDirectory, addDataDirectoryFolder, "root");
}

// Similar to above
async function getDataAccess() {
	var address = getContractAddress('dataAccessAddress');
	if (address) {
		dataAccess = await DataAccess.at(address);
	} else {
		await deployDataDirectory();
	}
}

// Similar to above
async function getUsersDirectory() {
	var address = getContractAddress('usersDirectoryAddress');
	if (address) {
		usersDirectory = await UsersDirectory.at(address);
	} else {
		await deployUsersDirectory();
	}
	await fetchUsersDirectory("root-users");

}

async function getFileHash (elementId) {
	var isFolder = await dataDirectory.isFolder(elementId);
	if (isFolder) {
		return ''
	}
	var hash = await dataDirectory.getFileHash(elementId, mainAccount);
	return hash;
}

// Combine all the three functions
async function getContracts() {
	await getDataAccess();
	await getUsersDirectory();
	await getDataDirectory();

	listenToEvents();
}


// Get the response when the contract is deployed on the blockchain
function listenToEvents() {

	dataDirectory.AddedElement({}, {fromBlock:1, toBlock:'latest'}).get(function(error, results) {
		results.forEach(function(result) {
			var event = {
				block: result.blockNumber,
				tx: result.transactionHash,
				desc: "A new element " + result.args.fullName + " has been added to the data node " + result.args.parentId + " by the admin " + result.args.user + "]"
			};
			displayEvent(event);
		});
	});

	dataDirectory.AddedHash({}, {fromBlock:1, toBlock:'latest'}).get(function(error, results) {
		results.forEach(function(result) {
			var event = {
				block: result.blockNumber,
				tx: result.transactionHash,
				desc: "A new hash " + result.args.hash + " has been added to the file " + result.args.fullName + " by the admin " + result.args.user + "]"
			};
			displayEvent(event);
		});
	});

	usersDirectory.AddedUser({}, {fromBlock:1, toBlock:'latest'}).get(function(error, results) {
		results.forEach(function(result) {
			var event = {
				block: result.blockNumber,
				tx: result.transactionHash,
				desc: "A user " + result.args.user + " has been added to the folder " + result.args.parentId + " by the admin " + result.args.admin + "]"
			};
			displayEvent(event);
		});
	});

	usersDirectory.AddedElement({}, {fromBlock:1, toBlock:'latest'}).get(function(error, results) {
		results.forEach(function(result) {
			var event = {
				block: result.blockNumber,
				tx: result.transactionHash,
				desc: "A new element " + result.args.fullName + " has been added to the data node " + result.args.parentId + " by the admin " + result.args.user + "]"
			};
			displayEvent(event);
		});
	});

	dataAccess.AccessChanged({}, {fromBlock:1, toBlock:'latest'}).get(function(error, results) {
		console.log(results);
		results.forEach(function(result) {
			var event = {
				block: result.blockNumber,
				tx: result.transactionHash,
				desc: "A group " + result.args.group
				+ " has been given <br/> [ read: " + result.args.read
				+ ", write: " + result.args.write
				+ ", admin: " + result.args.admin
				+ " ] access to the folder: " + result.args.folder
			};
			displayEvent(event);
		});
	});

	dataAccess.CreatorAdded({}, {fromBlock:1, toBlock:'latest'}).get(function(error, results) {
		console.log(results);
		results.forEach(function(result) {
			var event = {
				block: result.blockNumber,
				tx: result.transactionHash,
				desc: 'User ' + result.args.user + ' created directory ' + result.args.dir + "]"
			};
			displayEvent(event);
		});
	});
}

// When the webpage is loaded
window.onload = function() {
	$.busyLoadSetup({ animation: "fade", background: "rgba(25,152,162, 0.8)", text: "Processing the transaction..." });
	// Connecting to MetaMask
	//window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	if (!window.web3) {
		M.toast({html: "Please install metamask to connect to the Ethereum Kovan network."})
	} else {
		console.log(window.web3);
	}
	// Get the MetaMask accounts
	web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

    mainAccount = accs[0];
  	console.log("Main account: " + mainAccount);
  	// set provider?
	UsersDirectory.setProvider(web3.currentProvider);
	DataDirectory.setProvider(web3.currentProvider);
	DataAccess.setProvider(web3.currentProvider);
	// Get the contracts from the blockchain
	getContracts();

	});

};


// 
var rebuildCollapsible = function() {
	var elems = document.querySelectorAll('.collapsible');
	M.Collapsible.init(elems);

	var elems = document.querySelectorAll('select');
	M.FormSelect.init(elems);
};
// 
document.addEventListener('DOMContentLoaded', function () {
  rebuildCollapsible();
});

// Add user into group folder
window.addDirectoryElement = function(parentId, title, body='A very good guy.') {
	var parent = $('#' + parentId);
	var elem = $('<li><div class="collapsible-header"><i class="material-icons" style="color: #1998a2;">person</i>'
           + title + '</div><div class="collapsible-body"><p>'
           + body + '</p></div></li>');
	parent.append(elem);
	rebuildCollapsible();
};

// Add data folder into data folder
window.addDataDirectoryFolder = function(parentId, title, id) {
	var defaultIcons = {
		'Validations' : 'check_circle',
		'Donations' : 'money',
		'Outcomes' : 'thumb_up'
	};
	
	var parent = $('#' + parentId);
	var elem = $('<li>'+
		'<div class="collapsible-header" onclick="selectDataFolder(&apos;' + id +'&apos;, &apos;' + title +'&apos;)">'+
			'<i class="material-icons">' + (defaultIcons[title] || 'folder_item') + '</i>'+ title + 
		'</div>'+
		'<div class="collapsible-body">'+
			
			'<div class="row">'+
				'<div class="col s12 m12">'+ 
					'<ul id="' + id + '" class="collapsible" data-collapsible="accordion"></ul>'+ 
					'<div class="input-field col s8" style="margin:0;">'+
						'<input id="input_' + id +'" type="text" class="validate" style="height: 2.5rem;"><label for="name">Subfolder name</label>'+
					'</div>'+ 
					'<a class="waves-effect waves-light btn col s3" onclick="addElement(&apos;' + id +'&apos;)"><i class="material-icons right">add_circle</i>add folder</a>'+ 
				'</div>'+
				'<div class="col s12 m12">'+ 
					// '<ul id="' + id + '" class="collapsible" data-collapsible="accordion"></ul>'+ 
					'<div class="input-field col s8" style="margin:0;">'+
						// '<label id="file">Choose file to upload</label>'+
    					'<input type="file" ref="file" id="file'+id+'" name="file" multiple="multiple"/>'+
						// '<input id="input_0' + id +'" type="text" class="validate" style="height: 2.5rem;"><label for="name">File name</label>'+
					'</div>'+ 
					'<a class="waves-effect waves-light btn col s3" onclick="uploadToIpfs(&apos;'+id+'&apos;)"><i class="material-icons right">add_circle</i>add file</a>'+ 
				'</div>'+
			'</div>'+
		'</div>');
	parent.append(elem);
	rebuildCollapsible();
};

window.addReadOnlyDirectory = function (parentId, title, id) {
	var fileHash = getFileHash(id);
	var parent = $('#' + parentId);
	var elem = $('<li>'+
		'<div class="collapsible-header" onclick="selectDataFolder(&apos;' + id +'&apos;, &apos;' + title +'&apos;)">'+
			'<i class="material-icons">' + 'folder_item' + '</i>'+ title + 
		'</div>'+
		'<div class="collapsible-body">'+
			/////////////////'<a href="#" onclick="downloadAndDecrypt(&apos;'+fileHash+'&apos;)">'+fileHash+'</a>'+ /////////////
			'<div class="row">'+
				'<div class="col s12 m12">'+ 
					'<ul id="' + id + '" class="collapsible" data-collapsible="accordion"></ul>'+ 
				'</div>'+
			'</div>'+
		'</div>');
	parent.append(elem);
	rebuildCollapsible();
}

// Not used
window.addUserView = function(parentId, address) {
	var parent = $('#users_' + parentId);
	console.log(parent);
	var elem = $('<div><i class="material-icons">person</i>' + address + '</div>');
	parent.prepend(elem);
};

// Add user group folder
window.addUserDirectoryFolder = function(parentId, title, id) {
	var defaultIcons = {
		'Project Managers' : 'work',
		'Judges' : 'account_balance',
		'Donors' : 'face'
	};

	$("#selectedGroup").append('<option value="' + id + '">' + title + '</option>');

	var parent = $('#' + parentId);
	var elem = $('<li>'+
		'<div class="collapsible-header"><i class="material-icons">' + (defaultIcons[title] || 'folder_item') + '</i>'+ title + 
		'</div>'+
		'<div class="collapsible-body">'+
			'<div class="row">'+
				'<div class="col s12 m12">'+ 
				'<ul id="' + id + '" class="collapsible" data-collapsible="accordion"></ul>'+ 
				'<div class="input-field col s6" style="margin:0;"><input id="input_0' + id +'" type="text" class="validate" style="height: 2.5rem;"><label for="address">Group name</label>'+
				'</div>'+ 
			'<a class="waves-effect waves-light btn" onclick="addGroup(&apos;' + id +'&apos;)">'+
			'<i class="material-icons right">add_circle</i>add group</a>'+ 
			'</div>'+
			'<div class="row">'+
				'<div class="col s12 m12">'+ 
				'<ul id="' + id + '" class="collapsible" data-collapsible="accordion"></ul>'+ 
				'<div class="input-field col s6" style="margin:0;"><input id="input_' + id +'" type="text" class="validate" style="height: 2.5rem;"><label for="address">User address</label>'+
				'</div>'+ 
			'<a class="waves-effect waves-light btn" onclick="addUser(&apos;' + id +'&apos;)">'+
			'<i class="material-icons right">person_add</i>add user</a>'+ 
			'</div>'+
		'</div>');
	parent.append(elem);
	rebuildCollapsible();
};

// Used in listen to event
function displayEvent(event) {
	var shortTx = event.tx.substr(0, 20) + '...';
	var elem = $('<tr><td>' + event.block + '</td><td>' + shortTx + '</td><td>' + event.desc + '</td></tr>');
	$('#logs-table').prepend(elem);
}

// ?
// window.drawDataDirectory = function() {
// 	addDirectoryFolder("root", "Validations", "a1");
// 	addDirectoryFolder("a1", "St. Mungos", "b1");
// 	addDirectoryFolder("a1", "Fusion Housing", "b2");
// 	addDirectoryFolder("root", "Donations", "a2");
// 	addDirectoryFolder("root", "Outcomes", "a3");
// };

// Used by the next function
var redeployAll = async function() {
	await deployDataDirectory();
	await deployUsersDirectory();
	await deployDataAccess();
};

// redeploy all the contracts
window.redeploy = function() {
	redeployAll();
};

// Add data folder button, read text input
window.addElement = function(parentId) {
	var elem = $("#input_" + parentId);
	var fullName = elem.val();
	$("#input_" + parentId).val("");

	addDataElement(parentId, fullName);
};

// I have not finished
window.addFile = function(parentId){
	alert('Hello!');
	var hash = $("#input_0" + parentId);
	var fullName = hash.val();
	var hashValue = hash.val();
	$("#input_" + parentId).val("");

	addDataFile(parentId, fullName, mainAccount, hashValue);
}

// Add user into a group folder
window.addUser = function(parentId) {
	var elem = $("#input_" + parentId);
	var address = elem.val();
	$("#input_" + parentId).val("");
	console.log("Adding: " + address + " to: " + parentId);

	addUserElement(parentId, address);
};

// Add group folder
window.addGroup = function(parentId) {
	var elem = $("#input_0" + parentId);
	var fullName = elem.val();
	$("#input_0" + parentId).val("");
	console.log("Adding: " + fullName + " to: " + parentId);

	addGroupElement(parentId, fullName);
}

var selectAccesses = function(accesses) {
	$('#readAccess').prop('checked', accesses[0]);
	$('#writeAccess').prop('checked', accesses[1]);
	$('#adminAccess').prop('checked', accesses[2]);
};

window.selectDataFolder = function(id, title) {
	console.log("Select: " + id + title);
	$("#currentFolder").val(title);
	selectedFolderId = id;

	//Clear selected group
	$("#selectedGroup").val(0);
	M.FormSelect.init($("#selectedGroup"));

	//Clear access
	selectAccesses([false, false, false]);
};

// When change the group from the selection
window.onGroupChange = function() {
	var group = $('#selectedGroup').find(":selected").val();
	if (selectedFolderId && group) {
		console.log("Checking access folder: " + selectedFolderId + " group: " + group);
		dataAccess.recursivelyCheckAccess(selectedFolderId, group).then(function(result) {
			selectAccesses(result);
		})
	}
};

window.grantAccess = function() {
  var group = $('#selectedGroup').find(":selected").val();
  var read = $('#readAccess:checked').val() == 'on';
  var write = $('#writeAccess:checked').val() == 'on';
  var admin = $('#adminAccess:checked').val() == 'on';
  grantAccess(selectedFolderId, group, read, write, admin);
};

window.test = function() {
	dataAccess.recursivelyCheckAccess("0x05237c2519d43143913bf2b644b340a62e638dc4920d82a0b73239aec0f5668a", "Judges").then(function(result) {
		console.log(result);
	})
};

const IPFS = require('ipfs-api');
const ipfs = new IPFS('localhost', '5001', {protocol:'http'});

window.saveImageOnIpfs = function (reader) {
  return new Promise(function(resolve, reject) {
    const buffer = Buffer.from(reader.result);
    console.log('001')
  	console.log(reader.result)
    ipfs.add(buffer).then((response) => {
      console.log(response)
      resolve(response[0].hash);
    }).catch((err) => {
      console.error(err)
      reject(err);
    })
  })
}
// /
// / /
// // // window.downloadAndDecrypt = function (fileHash) {
/////////// if (fileHash){
// // // 	filePath = decrypt_re(fileHash);
// // // 	alert('File is downloaded at '+filePath);
/////////  }
// // // }

window.downloadFile = function (fileName, content) {
    var aTag = document.createElement('a');
    var blob = new Blob([content]);
    aTag.download = fileName;
    aTag.href = URL.createObjectURL(blob);
    aTag.click();
    URL.revokeObjectURL(blob);
    console.log('here');
}

window.uploadToIpfs = function (id) {
    var files = document.getElementById('file'+id)
    // var file = files[0];
    var reader = new FileReader();
    // reader.readAsDataURL(file);
    console.log(files.files[0]);

    var fileName = files.files[0].name;
    reader.readAsArrayBuffer(files.files[0]);
    reader.onloadend = function(e) {
      	console.log(reader);

    	downloadFile(fileName, reader.result);
// /
// / /
// //   //   	$.get('http://localhost:3000/', {'id':mainAccount, 'path':'/Users/CaiChunyu/Downloads', 'third':'encrypt'}, function(data, status) {
// // 		// 	console.log(data);
// // 		// 	console.log(status);
// // 		// 	fileHash = data;
// // 		// 	var fullName = await dataDirectory.getFullName(id);
// // 		// 	await dataDirectory.addFileHash(fullName, mainAccount, fileHash);
// // 		// })
	    	
      // 	saveImageOnIpfs(reader).then((hash) => {
      //   	console.log(hash);
        
      // });

    }
  }

