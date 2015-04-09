var express = require('express');
var app = express();
app.use(express.static(__dirname));
var server = require('http').createServer(app);

var redis = require('redis');

var redisClient = redis.createClient();

var io = require('socket.io')(server);

var moment = require('moment');

var emojify  = require('emoji-and-emoticons');




var messages = [];

var storeMessage = function(messageObj){

	redisClient.lpush("messages", JSON.stringify(messageObj), function(err, response){
		redisClient.ltrim("messages", 0, 15);
		console.log("messsage saved");
	});
};



io.on('connection', function(client){
	console.log("client Connected");

	client.on('messages', function(message){
			var date = moment().format('HH:mm');
			//console.log(date.format('YYYY'));
		    var sendingtime = date;
		    //console.log(sendingtime);
		    var images_path = "http://10.28.81.62:8085/node_modules/emoji-images/pngs/" // path of the images folder 
			var style       = "width: 50%"
			var emojifiedmsg   = emojify(message, images_path, style);
			nickname = client.nickname;
			messageObj = { 
				nickname: nickname,
				message : emojifiedmsg,
				sendingtime:sendingtime,
			}
			client.broadcast.emit("messages", messageObj);
			client.emit("messages", messageObj);
			storeMessage(messageObj);
		
	});




	client.on('join', function(name){
		client.nickname = name;
		client.broadcast.emit("chat", name +" Joined the chat");

		redisClient.lrange("messages", 0, -1, function(err, messages){
			messages = messages.reverse();

			messages.forEach(function(message){
				message = JSON.parse(message);
				console.log(message);
				client.emit("messages", message);	
			});
		});
		
	});
});

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

server.listen(9000);






