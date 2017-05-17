//JSON服务器 - 解析和处理请求参数, url模块，url.parse(req.url,true)
//第二个参数true，这个参数告诉url.parse函数解析查询字符串，并生成包含GET 参数的对象。如果我们使用url.parse解析前面的URL并打印结果，会 看到如下结果:
// {
// 	search:'?page=2&page_size=2',
// 	query:{page:'2',page_size:'2'},
// 	pathname:'/pic/pic1.json',
// 	path:'/pic/pic1.json?page=2&page_size=2',
// 	href:'/pic/pic1.json?page=2&page_size=2'
// }
//1)修改handle_incoming_request函数，让它能够正确解析 URL。
//2)解析查询字符串，获得page和page_size对应的值。
//3)修改load_album函数以支持这些参数。
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

	req.parsed_url = url.parse(req.url,true);
	var core_url = req.parsed_url.pathname;
	console.log('core url : ' + core_url);

	if(core_url === "/albums.json"){
		handle_list_albums(req,res);
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