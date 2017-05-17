//JSON服务器 - 解析和处理post请求
// req.read() - 获取post数据
//  > JSON.parse(req.read()) - JSON格式
//  > var qs = require('querystring'), qs.parse(req.read) - 获取form数据
var http = require('http');
var fs = require('fs');
var url = require('url');

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

function load_albums(album_name,page,page_size,callback){
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
					var ps;
					ps = dest_files.splice(page*page_size,page_size); //返回子数组
					var obj = {short_name:album_name,photos:ps};
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

	var param = req.parsed_url.query;
	console.log('params : ' + param);
	var page_num = param.page ? param.page : 0;
	var page_size = param.page_size ? param.page_size : 10;

	if(isNaN(parseInt(page_num))) page_num = 0;
	if(isNaN(parseInt(page_size))) page_size = 0;

	var core_url = req.parsed_url.pathname;
	var album_name = core_url.substr(5,core_url.length-10);
	console.log('album_name : ' + album_name);

	load_albums(album_name,page_num,page_size,function(err,albums){
		if(err){
			handle_failure(res);
		}else{
			handle_success(res,{album_data:albums});
		}
	});
}

function handle_rename_albums(req,res){
	//1. get old album name
	var core_url = url.parse(req.url,true).pathname;
	var parts = core_url.split('/');
	var album_name = parts[2];
	console.log('old name : ' + album_name);

	//2. get post data from request as JSON
	var json_body='';
	req.on(
		'readable',
		function(){
			var d = req.read();
			console.log("d : " + d +", type : " + (typeof d) + ", " + (d instanceof Buffer));
			if(d){
				if(typeof d == 'string'){
					json_body+=d;
				}else if(typeof d == 'object' && d instanceof Buffer){
					json_body += d.toString('utf8');
				}
			}
		}
	);

	req.on(
		'end',
		function(){
			console.log('json_body : ' + json_body);
			if(json_body){
				try{
					var album_data = JSON.parse(json_body);
					console.log("album_data : "  + album_data);
					//check if  error
				}catch(e){
					//handle error
				}

				//perform rename
				do_rename(
					album_name,				//old
					album_data.album_name,	//new
					function(err,result){

					}
				);
			}else{
				//handle no json body error
			}
		}
	);
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
	console.log(req.url.substr(0,4) + " ======" + req.url.substr(req.url.length-12));

	req.parsed_url = url.parse(req.url,true);
	var core_url = req.parsed_url.pathname;
	console.log('core url : ' + core_url);

	if(core_url === "/albums.json" && req.method.toLowerCase()=='get'){
		handle_list_albums(req,res);
	}else if(core_url.substr(core_url.length-12)=='/rename.json' && req.method.toLowerCase() == 'post'){
		console.log("post");
		handle_rename_albums(req,res);
	}else if(core_url.substr(0,4) === "/pic" && core_url.substr(core_url.length-5) === ".json"){
		handle_get_albums(req,res);
	}else{
		handle_failure(res);
	}
}

var server = http.createServer(handle_incoming_request);
server.listen(3000);

// error res : {"errno":-2,"code":"ENOENT","syscall":"scandir","path":"pic"}
// suc res : {"error":null,"data":{"albums":["load_albums.js","simple_server.js"]}}