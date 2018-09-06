var http = require('http');
var url = require('url');
var util = require('util');
const { spawn } = require('child_process');
var fs = require('fs');
const IPFS = require('ipfs-api');
const ipfs = new IPFS('localhost', '5001', {protocol:'http'});

var uploadToIpfs = function (fileName, file) {
    return new Promise(function(resolve, reject) {
        var fileObject = {
             path: fileName,
             content: file
        }
        ipfs.add(fileObject).then((response) => {
          // console.log(response)
          resolve(response[0].hash);
        }).catch((err) => {
          console.error(err)
          reject(err);
        })
    })
}

var downloadFromIpfs = function (cid) {
    return new Promise(function(resolve, reject) {
        ipfs.get(cid, function(err, files){
            files.forEach((file) => {
                fs.writeFile(file.path, file.content, (err) => {
                    if (err) throw err;
                    console.log('The file has been saved!');
                    resolve(file.path);
                });
            })
        }).catch((err)=>{
            console.log(err);
            reject(err);
        });
    })
}
 
http.createServer(function(req, res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
 
    // 解析 url 参数
    var params = url.parse(req.url, true).query;
    console.log(req.url);
    console.log(params.id);
    console.log(params.path);
    console.log(params.third);
    // res.write('python Client/client.py '+params.id+' '+ params.path+' '+params.third);
    // res.end();
    // Params.path is the local path for the file to be encrypted
    if (params.third == 'encrypt'){
        const encrypt = spawn('python', ['Client/client.py', params.id, params.path, params.third]);
        encrypt.stdout.on('data', (data) => {
        
            var filePath = data;
            fs.readFile(filePath, (err, data) => {
                if (err) throw err;
                var hash;
                uploadToIpfs(filePath, data).then((result)=>{
                    hash = result;
                    console.log(hash);
                    res.write(hash);
                    res.end()
                });
            })
            
        })
    }
    
	// params.path is the cid of the ipfs file
    if(params.third.length == params.id.length) {
        downloadFromIpfs(params.path).then((result) => {
            const re_encrypt = spawn('python', ['Client/client.py', params.id, result, params.third]);
            re_encrypt.stdout.on('data', (data)=>{
                var filePath = data;
                fs.readFile(filePath, (err, data) => {
                    if (err) throw err;
                    var hash;
                    uploadToIpfs(filePath, data).then((result)=>{
                        hash = result;
                        console.log(hash);
                        res.write(hash);
                        res.end()
                    });
                })
            })
            
        })

    }

    // params.path is the cid of the ipfs file
    if (params.third == 'decrypt_re') {
        downloadFromIpfs(params.path).then((result) => {
            // result is downloaded local path
            const decrypt_re = spawn('python', ['Client/client.py', params.id, result, params.third]);
            decrypt_re.stdout.on('data', (data)=>{
                var filePath = data;
                res.write(filePath);
                res.end();
            })
            
        })
    }

 
}).listen(3000);
