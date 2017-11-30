

var linebot = require('linebot');
var express = require('express');
const uuid = require('uuid/v1');
var apiai = require('apiai');
var app1 = apiai('df450cef4ea7467a8543a9c0ee587e2e');
var fs=require('fs');
var bot = linebot({
	channelId : '1547763729',
	channelSecret : '9e852ad5d789e81c1af1a51f6666d7c5',
	channelAccessToken : 'i9WIA5CANkd5E9XjHYgRfq3DbPS1klBRTvBQRGKahHjZUrvunsYfibJRgnXisONeMXfZRqdYAg20GgQUDf6WB6l+XRTFUrSkpZ94cf3dcG7br0qX6vXihJ7gNFK0yt/aEGWfetUB9mTDTqv0Zrp/SwdB04t89/1O/w1cDnyilFU='
});
var singer='test';
var check = false;
bot.on('message', function(event) {
  console.log(event); //把收到訊息的 event 印出來看看
  if (event.message.type = 'text') {
    var msg = event.message.text;
	var sessionid= uuid();
	if(singer == 'test'){
	var options = {
		sessionId: uuid(),
		contexts:[
      {
        "name": "find_singer-followup",
        "parameters": {
          "singer": "",
          "singer.original": ""
        }
        
      }
    ]
	};
	}
	else{
	var options = {
		sessionId: uuid(),
		contexts:[
      {
        "name": "find_singer-followup",
        "parameters": {
          "singer": singer,
          "singer.original": singer
        }
        
      }
    ]
	};	
		
		
	}
	console.log('singer :' + options.contexts[0].parameters.singer);
	console.log('singers' + singer);
	var request = app1.textRequest(msg,options);
	var context='';
	request.on('response',function(response){
			if(response.result.metadata.intentName=='find_singer - custom'){
			console.log('find_singer - custom');
			
			
			var path='./song_list/'+singer+'.txt';
			fs.readFile(path, function (err, data) {
			if (err) 
				console.log(err);
 
			var str=data.toString();
			if(str.includes(param['song.original'])==true)
			console.log('223 ~~ true');
			response.result.fulfillment.speech = '223 323 423';
			});
			
			console.log('check~~true');
			}
		    event.reply(response.result.fulfillment.speech).then(function(data) {
      // success 
			console.log(response);
			var param = response.result.contexts[0].parameters;
			console.log('response singer :' +response.result.parameters.singer);
			console.log(param['singer.original']);
			if(response.result.metadata.intentName=='find_singer'){
			console.log('find_singer!');
			singer=param['singer.original'];}

			}).catch(function(error) {
      // error 
			console.log('error');
			});
	});
	request.on('error',function(error){
		console.log(error);
	});
	request.end();
	console.log('bot1 end');
  }
});

var checkexist = function (fname,song){
	
	var path='./song_list/'+fname+'.txt';
	fs.readFile(path, function (err, data) {
    if (err) 
		console.log(err);
 
    var str=data.toString();
	console.log(str.includes(song));
	check = str.includes(song);
});
	
}
const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});