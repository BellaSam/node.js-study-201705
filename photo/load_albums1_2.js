//第一个JSON服务器
var http = require('http');
var fs = require('fs');

function load_albums_list(callback){
	fs.readdir(
		"pic",
		//方法 1. pic下的文件夹和文件全部扫描出来
		// function(err,files){
		// 	if(err){
		// 		callback(err);
		// 		return;
		// 	}
		// 	callback(null,files);
		// }

		//方法 2. 区分文件和文件夹，使用fs.stat函数判断
		//错误写法如下，原因在于for循环，因为Node.js是单线程运行的，所以所有的fs.stat函数都没有机会执行及调用回调函数，最后导致only_dirs的值一直是null，并将 这个值传给提供的回调函数。
		// function(err,files){
		// 	if(err){
		// 		callback(err);
		// 		return;
		// 	}

		// 	var only_dirs = [];
		// 	for(var i=0;i<files.length;i++){
		// 		fs.stat(
		// 			"pic/"+files[i],
		// 			function(err,str){
		// 				if(str.isDirectory()){
		// 					only_dirs.push(files[i]);
		// 				}
		// 			}
		// 		);
		// 	}
		// 	callback(null,only_dirs);
		// }
		//正确写法：使用递归实现
		function(err,files){
			if(err){
				callback(err);
				return;
			}

			var only_dirs = [];
			(function iterator(index){
			// for(var i=0;i<files.length;i++){
				if(index == files.length){
					callback(null,only_dirs);
					return;
				}
				fs.stat(
					"pic/"+files[index],
					function(err,str){
						if(err){
							callback(err);
							return;
						}
						if(str.isDirectory()){
							only_dirs.push(files[index]);
						}
						iterator(index+1);
					}
				);
			})(0);
			// callback(null,only_dirs);
		}

	);
}

function handle_incoming_request(req,res){
	console.log("Incoming Requests : " + req.method + " , " + req.url);
	load_albums_list(function(err,albums){
		if(err){
			res.writeHead(503,{"Content-Type":"application/json"});
			res.end(JSON.stringify(err) + '\n');
			return;
		}

		var out = {error:null,data:{albums:albums}};
		res.writeHead(200,{"Content-Type":"application/json"});
		res.end(JSON.stringify(out) + '\n');
	});
}

var server = http.createServer(handle_incoming_request);
server.listen(3000);

// error res : {"errno":-2,"code":"ENOENT","syscall":"scandir","path":"pic"}
// suc res : {"error":null,"data":{"albums":["load_albums.js","simple_server.js"]}}