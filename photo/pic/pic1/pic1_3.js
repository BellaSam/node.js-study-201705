var http = require('http');
var fs = require('fs');

function load_albums_list(callback){
	fs.readdir(
		"url",
		function(err,files){
			if(err){
				callback(err);
				return;
			}
			callback(null,files);
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
		res.writeHead(503,{"Content-Type":"application/json"});
		res.end(JSON.stringify(out) + '\n');
	});
}

var server = http.createServer(handle_incoming_request);
server.listen(3000);