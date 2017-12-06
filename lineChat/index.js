

var linebot = require('linebot');
var express = require('express');
const uuid = require('uuid/v1');
var apiai = require('apiai');
var app1 = apiai('df450cef4ea7467a8543a9c0ee587e2e');
var fs=require('fs');
var Step = require('step');

var bot = linebot({
	channelId : '1550487699',
	channelSecret : 'b5f5fa46550e29342d9dd02f65a338b1',
	channelAccessToken : 'JLLQQ1hO+SnP8gNUBqaFciBGWrqwFlwu9C3l9DX5K3zpzIvQS07tf5D8/1jK72Glfji1yhNhxJsJ0v/mhfbI8zlnKHmyGchne66Npukq/dPIF2s+NgsXn4OaEHu5g3mkLdC18Ee2nnSbTatOzD2lAAdB04t89/1O/w1cDnyilFU='
});


var singer='test';
var check = false;
var test ='test sent';
var contexts = { "contexts" :[{"name": "find_singer-followup","parameters": {'singer': "",'singer.original': ""}},{"name": "recent_song","parameters": {'recentsinger': "",'recentsinger.original': ""}}]};
var user_arr = [];
bot.on('message', function(event) {
  console.log(event); //把收到訊息的 event 印出來看看
  console.log('context-------------------------------------------');
  console.log(contexts.contexts);
  if (event.message.type = 'text') {
    var msg = event.message.text;
	var sessionid= uuid();
	var speech='';
	
	if(event.source.type == 'group')
		var userId = event.source.userId + event.source.groupId;
	else
		var userId = event.source.userId; 
	
	if(user_arr[userId] != undefined){
		console.log('user undefined !');
	contexts.contexts = JSON.parse(user_arr[userId]);
	}
	console.log(contexts.contexts);
		var options = {
			sessionId: uuid(),
			contexts: contexts.contexts
		};
		
		console.log('options-----------------------');
		console.log(options.contexts);
	
	
	// query information 
	var request = app1.textRequest(msg,options);
	
	request.on('response',function(response){
		
			var context_test = response.result.contexts;
			console.log('===========================================================');
			console.log(response.result.contexts);
						
			//get dialogflow's sentence
			speech = response.result.fulfillment.speech;
			
			for(var i=0;i<response.result.contexts.length;i++){
			if(response.result.contexts[i].name == 'find_singer-followup')
			var param = response.result.contexts[i].parameters;
			}
			//find_singer or listen_song
			if(response.result.metadata.intentName=='find_singer - custom' || response.result.metadata.intentName =='listen_song'){
				if(response.result.metadata.intentName =='listen_song')
					singer=param['singer.original'];
				else{				
				singer=param['singer.original'];
				console.log('find_singer - custom' +singer);
				}
				
				console.log('-----------param----------');
				console.log(param);
				var path='./song_list/'+singer+'.txt';
					fs.readFile(path, function (err, data) {
						if (err){ 
							console.log(err);
							speech = '沒有此歌手所唱歌曲資料';
						}
						var str=data.toString();
						if(str.includes(param['song.original'])==true){
						}else
						{
							speech = '歌手沒有唱此首歌';	
						}
							//line bot replay
							event.reply(speech).then(function(data) {
							// success 
							Step(
							clearContext()
							);													
							}).catch(function(error) {
							// error 
							console.log('error');
							console.log(error);
							});			
					});			
			
			}
			else{
				event.reply(speech).then(function(data) {
				// success 
				console.log(response);
				if(response.result.metadata.intentName=='find_singer'){
				console.log('find_singer!');
				Step(
				test123(),				
				putContext(event,response.result.contexts[0].parameters)
				
				);
				}

				}).catch(function(error) {
				// error 
				console.log('error replay');
				console.log(error);
				});
			}
	});
	request.on('error',function(error){
		console.log(error);
	});
	request.end();
	console.log('bot1 end');
	console.log(test);
  }
});
function test123(){
	console.log('test');
	
}
function putContext(user,param){
	console.log('put context');
	console.log(param);
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId; 
	
	singer = param['singer.original'];
	/*for(var i=0;i<response.result.contexts.length;i++){
		if(response.result.contexts[i].name == 'find_singer-followup')
			var find_singer_followup = i;

	}*/
	console.log(contexts.contexts);
	contexts.contexts[0].parameters['singer'] = singer;
	contexts.contexts[0].parameters['singer.original'] = singer;
	user_arr[userId] = JSON.stringify(contexts.contexts);
	console.log('------------user context--------------');
	console.log(user_arr[userId]);
}

function clearContext(){
	console.log('clear context');
	
	for(var i=0;i<response.result.contexts.length;i++){
		if(response.result.contexts[i].name == 'find_singer-followup')
			var find_singer_followup = i;
		else if (response.result.contexts[i].name == 'recent_song')
			var recent_song = i;
	}
	
	contexts.contexts[recent_song].parameters['recent_singer'] = contexts.contexts[find_singer_followup].parameters.parameters['singer'];
	contexts.contexts[recent_song].parameters['recent_singer.original'] = contexts.contexts[find_singer_followup].parameters.parameters['singer.original'];	
	contexts.contexts[find_singer_followup].parameters['singer'] = "";
	contexts.contexts[find_singer_followup].parameters['singer.original'] = "";
	console.log(contexts.contexts[recent_song]);
}



const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});