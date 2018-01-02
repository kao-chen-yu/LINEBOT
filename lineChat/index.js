

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

var http = require("http");
var singer='test';
var check = false;
var test ='test sent';
var contexts = { "contexts" :[{"name": "find_singer-followup","parameters": {'singer': "",'singer.original': ""}},{"name": "recent_song","parameters": {'recent_singer': "",'recent_singer.original': ""}},{"name": "play_list","parameters": {'song_list': "",'now': "",'pause' :"false"}},
				{"name" : "search_list", "parameters" :{"list" : "","singer":""}}]};
var user_arr = [];
var search_url = 'http://search.mymusic.net.tw/mobile/index?select4=ftsong&pageNo=1&pageSize=10&out_type=json&textfield2=';
console.log('------start-------');
setInterval(function() {
	console.log('waiting');
	http.get("http://ezpeer2.herokuapp.com");
}, 60000); // every 5 minutes (300000)

//Line BOT Start-------------------------------------------------------
bot.on('message', function(event) {
  console.log(event); //把收到訊息的 event 印出來看看

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
		console.log('------user had say something before !---------');
		contexts.contexts = JSON.parse(user_arr[userId]);
	}
	
	var options = {
		sessionId: uuid(),
		contexts: contexts.contexts
	};
		
	console.log('options-----------------------');
	console.log(options.contexts);
		
	// query information 
	var request = app1.textRequest(msg,options);
	
	//------get dialogflow response ---------------
	request.on('response',function(response){
		
			var context_test = response.result.contexts;
			console.log('------response context ---------');
			console.log(response.result.contexts);
						
			//get dialogflow's sentence
			speech = response.result.fulfillment.speech;
			
			for(var i=0;i<response.result.contexts.length;i++){
				if(response.result.contexts[i].name == 'find_singer-followup')
				var param = response.result.contexts[i].parameters;
			}
			
			//----find_singer - custom or listen_song
			if(response.result.metadata.intentName=='find_singer - custom' || response.result.metadata.intentName =='listen_song'){
				if(response.result.metadata.intentName =='listen_song')
					singer=param['singer.original'];
				else{				
					singer=param['singer.original'];
					console.log('find_singer - custom' +singer);
				}
				var url = search_url + encodeURIComponent(singer + '+' + param['song.original'])
				http.get(url,function(response){
					response.on("data", function(data) {
						console.log(data.toString());
						SearchResult(JSON.parse(data.toString()),singer,event,function(result){
							console.log(result);
							
							event.reply(result).then(function(data) {

							}).catch(function(error) {
							// error 
								console.log('error create list');
								//console.log(error);
							});
						});
					});
				});
			}else if (response.result.metadata.intentName== 'play_search_song'){
				for(var i=0;i<response.result.contexts.length;i++){
					if(response.result.contexts[i].name == 'search_list')
						var search_list = response.result.contexts[i].parameters;
				}
				
				setSearchSong(search_list,event,function(result){
					event.reply(result).then(function(data) {
					}).catch(function(error) {
					// error 
					console.log('error 查看 replay');
					//console.log(error);
					});
					
				});
				
				
			//---------------------playlist controll -----------------------------
			}else if (response.result.metadata.intentName== 'playlist_controll'){
				console.log('------- playlist_controll------------');
				for(var i=0;i<response.result.contexts.length;i++){
					if(response.result.contexts[i].name == 'recent_song')
						var recent_song =  response.result.contexts[i].parameters;
						if (recent_song['playlist_singername.original'] == '')
							recent_song['playlist_singername.original'] = '暫時';
				}
			console.log('------- playlist_controll------------');
			console.log(recent_song['playlist_action.original']);
			
			var user_info =  event;
			

			if (recent_song['playlist_action.original'] == '查看'){
				listPlayList(user_info,recent_song,function(result){
					console.log('callback list');
					speech = result;
					
					console.log('-----------------查看 speech---------------');
					console.log(speech);
					event.reply(speech).then(function(data) {
					event.replyToken = uuid();
					}).catch(function(error) {
					// error 
					console.log('error 查看 replay');
					//console.log(error);
					});
				});	
			}
			else if(recent_song['playlist_action.original'] == '刪除'){
				deletePlayList(user_info,recent_song, function(result){
					event.reply(speech).then(function(data) {

					}).catch(function(error) {
						// error 
						console.log('error delete list');
						//console.log(error);
					});
				});
			}
			else if(recent_song['playlist_action.original'] == '列出'){
				listPlayListname(user_info , function(result){
					
					speech = result;
					event.reply("結果如下 : " + speech).then(function(data) {

					}).catch(function(error) {
						// error 
						console.log('error list dictionary ');
						//console.log(error);
					});
				});
				
			}else if (recent_song['playlist_action.original'] == '建立'){
					createPlayList(user_info,recent_song,function(createresult){
						
						speech = createresult;
						
						event.reply(speech).then(function(data) {

						}).catch(function(error) {
						// error 
						console.log('error create list');
						//console.log(error);
						});
						
					});
			//---------加入歌單------------
			}else{
				checkPlayList(user_info , function(checkresult){
					
					console.log(checkresult);
					
					addPlayList(user_info,recent_song,function(addresult){
						
						speech = addresult;
						
						event.reply(speech).then(function(data) {

						}).catch(function(error) {
						// error 
						console.log('error list');
						//console.log(error);
						});
					});
					
				});
			}		
			}
			
			//------------------------player controll--------------------------------
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
						console.log(pause);
						if(pause == 'true'){
							
							getSongnow(user_info,function(result){
							console.log(result);
						
								event.reply('開始撥放' + result ).then(function(data) {

								}).catch(function(error) {
								// error 
									console.log('error play');
									//console.log(error);
								});
							});
				
							changepause(user_info,function(result){
							});
						
						}else{
							setPlayList(user_info,recent_song,function(result){
								console.log('callback player list');
								console.log(result);
								
								if(result == 'success'){
									getSongnow(user_info,function(result_song){
										console.log('-----------------get song speech---------------');
						
										event.reply('開始撥放' + result_song ).then(function(data) {

										}).catch(function(error) {
											// error 
											console.log('error play replay');
											//console.log(error);
										});
						
									});
								}else{
									speech = result;
									event.reply(speech).then(function(data) {

									}).catch(function(error) {
									// error 
									console.log('error list');
									//console.log(error);
									});
								}
							});
						}
					});
					
				}else if (recent_song['play_action.original'] == '暫停'){
					
					console.log('------暫停-------');
				
					changepause(user_info,function(result){
						console.log(result);
					
						event.reply(speech).then(function(data) {

						}).catch(function(error) {
							// error 
							console.log('error list');
							//console.log(error);
						});
					});
			
				}else if (recent_song['play_action.original'] == '下一首'){
				
					console.log('------下一手------');
					
					nextSong(user_info , function(result){
						console.log(result);
						
						getSongnow(user_info , function(result_song){
					
							event.reply('開始撥放' + result_song ).then(function(data) {

							}).catch(function(error) {
								// error 
								console.log('error list');
								//console.log(error);
							});	
						
						});
					});
			
				}else if (recent_song['play_action.original'] == '上一首'){
				
					console.log('------上一手------');
				
					previousSong(user_info , function(result){
						console.log(result);
					
						getSongnow(user_info , function(result_song){
						
							event.reply('開始撥放' + result_song ).then(function(data) {

							}).catch(function(error) {
								// error 
								console.log('error list');
								//console.log(error);
							});	
						
						});
					});
				}else{
					
					event.reply(speech).then(function(data) {

					}).catch(function(error) {
						// error 
						console.log('error list');
						//console.log(error);
						});											
				}
			
			//------------player controll end--------------------------------------------
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
	
  }
});


//------------functions
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
	
	contexts.contexts[0].parameters['singer'] = singer;
	contexts.contexts[0].parameters['singer.original'] = singer;
	user_arr[userId] = JSON.stringify(contexts.contexts);
	console.log('------------user context--------------');
	console.log(user_arr[userId]);
}
function SearchResult(search_result,singer,user,cb){
	

	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
	var songs = search_result.song;
	var song_list='';
	var list = '';
	for(var i=0;i<songs.length;i++){
		song_list = song_list + (i+1) + ' ' + songs[i].song_name + '\n';
		list = list +songs[i].song_name + '\n'
		
	}
	
	var user_json = JSON.parse(user_arr[userId]);
	
	for(var i=0;i<user_json.length;i++){
		console.log(user_json[i].name);
		if(user_json[i].name == 'search_list'){
			user_json[i].parameters['list'] = list;
			user_json[i].parameters['singer'] = singer;
		}
	}
	
	user_arr[userId] = JSON.stringify(user_json);
	console.log('------------user context---------------');
	console.log(user_arr[userId]);
	
	song_list = song_list + '你要聽哪一首'
	
	cb(song_list);
	
}

function setSearchSong(search_list,user,cb){
	
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
	var user_json = JSON.parse(user_arr[userId]);
	
	var num = search_list.number;
	var singer = search_list.singer;
	var song_arr = search_list['list'].split('\n');
	
	for(var i=0;i<user_json.length;i++){
		console.log(user_json[i].name);
		if(user_json[i].name == 'recent_song'){
			user_json[i].parameters['recent_singer'] = singer;
			user_json[i].parameters['recent_song'] = song_arr[num];
		}
	}
	
	user_arr[userId] = JSON.stringify(user_json);
	console.log('------------user context---------------');
	console.log(user_arr[userId]);
	
	cb('開始撥放' + singer + '\t' + song_arr[num]);
}
function clearContext(user,param){
	console.log('clear context');
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
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
function checkPlayList(user,cb){
	
	console.log(' check playlist ');
	if(user.source.type == 'group'){
		var f_path = 'playlist/group';
		if(fs.existsSync(f_path) == false){
			console.log(' check playlist ');
		fs.mkdirSync(f_path);}
		f_path = f_path + '/' + user.source.groupId;
		if(fs.existsSync(f_path) == false){
			console.log(' check playlist ');
		fs.mkdirSync(f_path);}
		f_path = f_path + '/' +user.source.userId ;
		if(fs.existsSync(f_path) == false){
			console.log(' check playlist ');
		fs.mkdirSync(f_path);}			
	}else{ 
		
		var f_path = 'playlist/user/';
		if(fs.existsSync(f_path) == false)
			fs.mkdirSync(f_path);
		f_path = f_path + user.source.userId ;
		if(fs.existsSync(f_path) == false)
			fs.mkdirSync(f_path);
	}	
	cb(' create dictionary success ');
}
function addPlayList(user,recent_song,cb){
	
	console.log('add play list');
	if(user.source.type == 'group'){
		var f_path = 'playlist/group/' + user.source.groupId + '/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}else{
		var f_path = 'playlist/user/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}
	var song_info = recent_song['recent_singer.original'] +'\t' +recent_song['recent_song.original'] + '\n';
	console.log('--------palylist name------------');
	console.log(f_path);
	console.log(fs.existsSync(f_path));
	console.log('---------song_info---------------');
	console.log(song_info);
	console.log(recent_song['recent_singer.original'] + recent_song['recent_song.original']);
	if(recent_song['recent_singer.original'] != 'undefined' && recent_song['recent_song.original'] != 'undefined'){
		if(fs.existsSync(f_path) == false){
			if(recent_song['playlist_singername.original'] == '暫時'){
				fs.writeFileSync(f_path,song_info);
			cb('加入至暫時歌單');
			}
			else{
			console.log('----------error playlist not exist----------');
			console.log(f_path);
			cb(' 此歌單尚未創建');
			}
		}else{
			console.log('----------playlist exist and add song -----------');
			fs.appendFileSync(f_path,song_info);
			cb (song_info + ' 以加入至' + recent_song['playlist_singername.original'] +'歌單 ');
		}
	}else{
		cb(' 無加入歌手歌曲資訊 ');
	}
}

function createPlayList(user,recent_song,cb){
	
	console.log('create play list');
	if(user.source.type == 'group'){
		var f_path = 'playlist/group/' + user.source.groupId + '/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}else{
		var f_path = 'playlist/user/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}
	console.log('--------palylist name-------------');
	console.log(f_path);
	console.log(fs.existsSync(f_path));
	if(fs.existsSync(f_path) == false){
		console.log('----------create playlist and add song----------');
		console.log(f_path);
		fs.writeFileSync(f_path,'');
		cb (recent_song['playlist_singername.original'] + ' 歌單建立成功 ');
	}else{
		console.log('----------playlist exist and add song -----------');
		cb (recent_song['playlist_singername.original'] + ' 歌單已存在 ');
	}
}

function deletePlayList(user,recent_song,cb){
	
	console.log('delete play list');
	if(user.source.type == 'group'){
		var f_path = 'playlist/group/' + user.source.groupId + '/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}else{
		var f_path = 'playlist/user/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}

	console.log('--------palylist name------------');
	console.log(f_path);
	console.log(fs.existsSync(f_path));
	if(fs.existsSync(f_path) == false){
		console.log('----------no file ----------');
		console.log(f_path);
	}else{
		console.log('----------playlist exist and delete -----------');
		fs.unlinkSync(f_path);
	}
	console.log(fs.existsSync(f_path));
	cb('delete end');
}

function listPlayListname(user,cb){
	
	console.log('delete play list');
	if(user.source.type == 'group'){
		var f_path = 'playlist/group/' + user.source.groupId + '/' + user.source.userId ;
	}else{
		var f_path = 'playlist/user/' + user.source.userId ;
	}

	console.log('--------palylist dictionary------------');
	console.log(f_path);
	console.log(fs.existsSync(f_path));
	fs.readdir(f_path, function(err,data){
		if(err){
			console.log('read dictionary error');
			cb(' 沒有此user 歌單資料 ');
		}
		else{
		cb(data);
		}
	});
	
	
}
function listPlayList(user,recent_song,cb){
	
	console.log('----------list playlist--------');
	if(user.source.type == 'group'){
		var f_path = 'playlist/group/' + user.source.groupId + '/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}else{
		var f_path = 'playlist/user/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}
	
	fs.readFile(f_path, function (err, data) {
    if (err) {
		console.log('listPlaylist error');
		cb('查無此歌單');
	}
	else{
    console.log(data.toString());
	cb(data.toString());}
});
	
}

function setPlayList(user,recent_song,cb){

	console.log('---------prepare playlist ------');
	if(user.source.type == 'group')
		var userId = user.source.userId + user.source.groupId;
	else
		var userId = user.source.userId;
	
	if(user.source.type == 'group'){
		var f_path = 'playlist/group/' + user.source.groupId + '/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}else{
		var f_path = 'playlist/user/' + user.source.userId + '/' +recent_song['playlist_singername.original'] + '.txt';
	}
	
	fs.readFile(f_path, function (err, data) {
    if (err) {
		console.log('setplaylist error');
		cb('無此歌單資料');
	}
    //console.log(data.toString());	
	else{
	contexts.contexts[2].parameters['song_list'] = data.toString();
	contexts.contexts[2].parameters['song_list_number'] = data.toString().split('\n').length-1;
	contexts.contexts[2].parameters['now'] = 0;
	contexts.contexts[2].parameters['pause'] = 'false';
	user_arr[userId] = JSON.stringify(contexts.contexts);
	cb('success');
	}
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
	
	var song_arr = songlist_json.parameters['song_list'].split('\n');
	var song_info = song_arr[songlist_json.parameters['now']].split('\t');
	
	for(var i=0;i<song_json.length;i++){
		if(song_json[i].name == 'recent_song'){
			song_json[i].parameters['recent_singer'] = song_info[0];
			song_json[i].parameters['recent_song'] = song_info[1];
		}
	}
	
	user_arr[userId] = JSON.stringify(song_json);	
	console.log('------------user context---------------');
	console.log(user_arr[userId]);
	
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
			if(songlist_json.parameters['now'] < songlist_json.parameters['song_list_number']-1){
				songlist_json.parameters['now'] = parseInt(songlist_json.parameters['now'])+1;
			}else{
				songlist_json.parameters['now'] = songlist_json.parameters['song_list_number']-1;
			}
			song_json[i] = songlist_json;
	}}
	user_arr[userId] = JSON.stringify(song_json);
	
	cb('next song success');
}

function previousSong(user,cb){
	
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
	if(!user_arr[userId]){
	cb('false');
    }else{	
	var song_json = JSON.parse(user_arr[userId]);
	
	for(var i=0;i<song_json.length;i++){
		if(song_json[i].name == 'play_list'){
			var songlist_json = song_json[i];			
				cb(songlist_json.parameters['pause']);
			
	}}
	}
	cb('false');
}
const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);



//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});