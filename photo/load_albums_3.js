//JSON服务器 - 处理更多请求
var http = require('http');
var fs = require('fs');

function load_albums_list(callback){
	fs.readdir(
		"pic",
		function(err,files){
			if(err){
				callback(err);
				return;
			}

			var only_dirs = [];
			(function iterator(index){
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
		}

	);
}

function load_albums(album_name,callback){
	fs.readdir(
		"pic/"+album_name,
		function(err,files){
			if(err){
				callback(err);
				return;
			}

			var dest_files = [];
			(function iterator(index){
				if(index == files.length){
					var obj = {short_name:album_name,photos:dest_files};
					callback(null,obj);
					return;
				}
				fs.stat(
					"pic/"+album_name+"/"+files[index],
					function(err,str){
						if(err){
							callback(err);
							return;
						}
						if(str.isFile()){
							var obj = {filename:files[index],desc:files[index]};
							dest_files.push(obj);
						}
						iterator(index+1);
					}
				);
			})(0);
		}

	);
}

function handle_list_albums(req,res){
	load_albums_list(function(err,albums){
		if(err){
			handle_failure(res);
			return;
		}
		handle_success(res,albums);
	});
}

function handle_get_albums(req,res){
	var album_name = req.url.substr(5,req.url.length-10);
	console.log("album_name : " + album_name);
	load_albums(album_name,function(err,albums){
		if(err){
			handle_failure(res);
		}else{
			handle_success(res,{album_data:albums});
		}
	});
}

function handle_success(res,albums){
	var out = {error:null,data:{albums:albums}};
	res.writeHead(200,{"Content-Type":"application/json"});
	res.end(JSON.stringify(out) + '\n');
}

function handle_failure(res){
	res.writeHead(503,{"Content-Type":"application/json"});
	res.end(JSON.stringify({err:"error happen"}) + '\n');
}

function handle_incoming_request(req,res){
	console.log("Incoming Requests : " + req.method + " , " + req.url);
	console.log(req.url.substr(0,4) + " ======" + req.url.substr(req.url.length-5));
	if(req.url === "/albums.json"){
		handle_list_albums(req,res);
	}else if(req.url.substr(0,4) === "/pic" && req.url.substr(req.url.length-5) === ".json"){
		handle_get_albums(req,res);
	}else{
		handle_failure(res);
	}
}

var server = http.createServer(handle_incoming_request);
server.listen(3000);

// error res : {"errno":-2,"code":"ENOENT","syscall":"scandir","path":"pic"}
// suc res : {"error":null,"data":{"albums":["load_albums.js","simple_server.js"]}}