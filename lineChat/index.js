

var linebot = require('linebot');
var express = require('express');
const uuid = require('uuid/v1');
var apiai = require('apiai');
var app1 = apiai('df450cef4ea7467a8543a9c0ee587e2e');
var fs=require('fs');
var Step = require('step');

var bot = linebot({
	channelId : '1547763729',
	channelSecret : '9e852ad5d789e81c1af1a51f6666d7c5',
	channelAccessToken : 'i9WIA5CANkd5E9XjHYgRfq3DbPS1klBRTvBQRGKahHjZUrvunsYfibJRgnXisONeMXfZRqdYAg20GgQUDf6WB6l+XRTFUrSkpZ94cf3dcG7br0qX6vXihJ7gNFK0yt/aEGWfetUB9mTDTqv0Zrp/SwdB04t89/1O/w1cDnyilFU='
});


var singer='test';
var check = false;
var test ='test sent';
var contexts = { "contexts" :[{"name": "find_singer-followup","parameters": {'singer': "",'singer.original': ""}},{"name": "recent_song","parameters": {'recent_singer': "",'recent_singer.original': ""}},{"name": "play_list","parameters": {'song_list': "",'now': "",'pause' :"false"}}]};
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
	console.log(user_arr[userId]);
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
							clearContext(event,param)
							);													
							}).catch(function(error) {
							// error 
							console.log('error');
							//console.log(error);
							});			
					});			
			
			}
			//-----------------------------------------------------------------------
			else if (response.result.metadata.intentName== 'playlist_controll'){
				console.log('------- playlist_controll------------');
			for(var i=0;i<response.result.contexts.length;i++){
			if(response.result.contexts[i].name == 'recent_song')
			var recent_song =  response.result.contexts[i].parameters;
				if (recent_song['playlist_singername.original'] == '')
					recent_song['playlist_singername.original'] = '暫時';
			}
			console.log('------- playlist_controll------------');
			console.log(recent_song);
			
			var user_info =  event.source;
			
			try{
			if (recent_song['playlist_action.original'] == '查看'){
				listPlayList(user_info,recent_song,function(result){
					console.log('callback list');
					speech = result;
					
					console.log('-----------------lsit2 speech---------------');
					console.log(speech);
					event.reply(speech).then(function(data) {
					event.replyToken = uuid();
					}).catch(function(error) {
					// error 
					console.log('error list');
					console.log(error);
					});
				});	
			}
			else{
			Step(
				checkPlayList(user_info),
				addPlayList(user_info,recent_song)
			);}
			}catch(err){
				console.log('add error');
				console.log(err);
			console.log('-----------------lsit speech---------------');
			console.log(speech);
			event.reply(speech).then(function(data) {

			}).catch(function(error) {
				// error 
				console.log('error list');
				//console.log(error);
				});
			}
			
			}
			
			//--------------------------------------------------------------------
			else if (response.result.metadata.intentName== 'player_controll'){
			for(var i=0;i<response.result.contexts.length;i++){
			if(response.result.contexts[i].name == 'recent_song')
			var recent_song =  response.result.contexts[i].parameters;
				if (recent_song['playlist_singername.original'] == '')
					recent_song['playlist_singername.original'] = '暫時';
			}
			console.log('------- player_controll------------');
			console.log(recent_song);
			
			var user_info =  event;
			if (recent_song['play_action.original'] == '播放'){
				checkpause(user_info, function(pause){
				if(pause == 'true'){
					getSongnow(user_info,function(result){
						
						console.log(result);
						
						event.reply('開始撥放' + result ).then(function(data) {

					}).catch(function(error) {
					// error 
					console.log('error list=');
					//console.log(error);
					});
					});
				changepause(user_info,function(result){
					
				});
				}else{
				listPlayList(user_info,recent_song,function(result){
					console.log('callback player list');
				
										
					console.log('-----------------list speech---------------');
					
					event.reply('開始撥放' + result ).then(function(data) {

					}).catch(function(error) {
					// error 
					console.log('error list');
					//console.log(error);
					});
					
					
				});
				}
			});
			}
			
			//----------------------------------------------------------------
			}else{
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
				//console.log(error);
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

function clearContext(user,param){
	console.log('clear context');
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
	console.log(contexts.contexts);
	contexts.contexts[1].parameters['recent_singer'] = param['singer'];
	contexts.contexts[1].parameters['recent_singer.original'] = param['singer.original'];	
	contexts.contexts[1].parameters['recent_song'] = param['song.original'];
	contexts.contexts[1].parameters['recent_song.original'] = param['song.original'];	
	contexts.contexts[0].parameters['singer'] = "";
	contexts.contexts[0].parameters['singer.original'] = "";
	user_arr[userId] = JSON.stringify(contexts.contexts);
	console.log(user_arr[userId]);
}

function saveSonglist(song_list){
	contexts.contexts[2].parameters['song_list'] = song_list;
	contexts.contexts[2].parameters['now'] = 0;
}
function checkPlayList(user){
	
	console.log(' check playlist ');
	if(user.type == 'group'){
		var f_path = 'playlist/group';
		if(fs.existsSync(f_path) == false){
			console.log(' check playlist ');
		fs.mkdirSync(f_path);}
		f_path = f_path + '/' + user.groupId;
		if(fs.existsSync(f_path) == false){
			console.log(' check playlist ');
		fs.mkdirSync(f_path);}
		f_path = f_path + '/' +user.userId ;
		if(fs.existsSync(f_path) == false){
			console.log(' check playlist ');
		fs.mkdirSync(f_path);}			
	}else{ 
		
		var f_path = 'playlist/user/';
		if(fs.existsSync(f_path) == false)
			fs.mkdirSync(f_path);
		f_path = f_path + user.userId ;
		if(fs.existsSync(f_path) == false)
			fs.mkdirSync(f_path);
	}
	console.log('-------path--------');
	console.log(f_path);
	console.log(fs.existsSync(f_path));
	
	return f_path;
	
}
function addPlayList(user,recent_song){
	
	console.log('add play list');
	if(user.type == 'group'){
		var f_path = 'playlist/group/' + user.groupId + '/' + user.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}else{
		var f_path = 'playlist/user/' + user.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}
	var song_info = recent_song['recent_singer.original'] +'\t' +recent_song['recent_song.original'] + '\n';
	console.log('--------palylist name------------');
	console.log(f_path);
	console.log(fs.existsSync(f_path));
	console.log('---------song_info---------------');
	console.log(song_info);
	if(fs.existsSync(f_path) == false){
		console.log('----------create playlist and add song----------');
		console.log(f_path);
		fs.writeFileSync(f_path,song_info);
	}else{
		console.log('----------playlist exist and add song -----------');
		fs.appendFileSync(f_path,song_info);
	}
}

function listPlayList(user,recent_song,cb){
	
	console.log('----------list playlist--------');
	if(user.source.type == 'group'){
		var f_path = 'playlist/group/' + user.source.groupId + '/' + user.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}else{
		var f_path = 'playlist/user/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}
	
	fs.readFile(f_path, function (err, data) {
    if (err) throw err;
	
    console.log(data.toString());
	cb(data.toString());
});
	
}

function setPlayList(user,recent_song,cb){

	console.log('---------prepare playlist ------');
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
	console.log(contexts.contexts);
	
	if(user.source.type == 'group'){
		var f_path = 'playlist/group/' + user.source.groupId + '/' + user.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}else{
		var f_path = 'playlist/user/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}
	
	fs.readFile(f_path, function (err, data) {
    if (err) throw err;
	
	if(contexts.contexts[2].name == 'play_list')
		console.log(' set is true ');
	
    console.log(data.toString());
	
	contexts.contexts[2].parameters['song_list'] = data.toString();
	contexts.contexts[2].parameters['now'] = 0;
	
	user_arr[userId] = JSON.stringify(contexts.contexts);
	cb('set playlist success');
});
	
}

function getSongnow(user,cb){
	
	console.log('-----get sonng ----------');
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
	var song_json = JSON.parse(user_arr[userId]);
    
	for(var i=0;i<song_json.length;i++){
		if(song_json[i].name == 'play_list')
			var songlist_json = song_json[i];
	}
	console.log(songlist_json);
	
	var song_arr = songlist_json.parameters['song_list'].split('\n');
	
	cb(song_arr[songlist_json.parameters['now']]);
	
}

function nextSong(user,cb){
	
	console.log('---------next------------');
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
	var song_json = JSON.parse(user_arr[userId]);
    
	for(var i=0;i<song_json.length;i++){
		if(song_json[i].name == 'play_list'){
			var songlist_json = song_json[i];
			songlist_json.parameters['now'] = parseInt(songlist_json.parameters['now'])+1;
			song_json[i] = songlist_json;
	}}
	user_arr[userId] = JSON.stringify(song_json);
	
	cb('next song success');
}

function previous(user,cb){
	
	console.log('---------previous------------');
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
	var song_json = JSON.parse(user_arr[userId]);
    
	for(var i=0;i<song_json.length;i++){
		if(song_json[i].name == 'play_list'){
			var songlist_json = song_json[i];
			if( songlist_json.parameters['now'] >0)
				songlist_json.parameters['now'] = parseInt(songlist_json.parameters['now'])-1;
			else
				songlist_json.parameters['now'] = 0;
			song_json[i] = songlist_json;
	}}

	user_arr[userId] = JSON.stringify(song_json);
	
	cb('previous song success');
}

function changepause(user,cb){
	
	console.log('---------pause------------');
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
	var song_json = JSON.parse(user_arr[userId]);
    
	for(var i=0;i<song_json.length;i++){
		if(song_json[i].name == 'play_list'){
			var songlist_json = song_json[i];
				if(songlist_json.parameters['pause'] == 'true')
					songlist_json.parameters['pause'] = "false";
				else
					songlist_json.parameters['pause'] = "true";
			song_json[i] = songlist_json;
	}}

	user_arr[userId] = JSON.stringify(song_json);
	
	cb('pause success');

}


function checkpause(user,cb){
	
	console.log('---------pause------------');
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
	var song_json = JSON.parse(user_arr[userId]);
    
	for(var i=0;i<song_json.length;i++){
		if(song_json[i].name == 'play_list'){
			var songlist_json = song_json[i];			
				cb(songlist_json.parameters['pause']);
			
	}}
}
const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});