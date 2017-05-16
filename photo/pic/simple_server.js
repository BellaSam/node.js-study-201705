var http = require('http');
http.createServer(function(req,res){
	console.log("request : " + req.method + " , " + req.url);
	res.writeHead(200,{"Content-Type":"application/json"});
	res.end(JSON.stringify({error:'missing url','message':'You have to add url'})+'\n');
}).listen(3000);