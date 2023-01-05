const config = require('../configure');

/* local server */
const REDIS_PORT = 6380;
const Redis = require("ioredis"); 
const redisClient = new Redis(REDIS_PORT);

/* aws server */
// const REDIS_PORT = 6379;
// const REDIS_URL = "redis-test.i187of.ng.0001.use1.cache.amazonaws.com"
// const Redis = require("ioredis"); 
// const redisClient = new Redis(REDIS_PORT, REDIS_URL);

const { RedisSessionStore } = require("../sessionStore");
const sessionStore = new RedisSessionStore(redisClient);

const { redisHashTableStore } = require("../redisHashTableStore");
const hashtableStore = new redisHashTableStore(redisClient);

const { RedisJsonStore } = require("../redisJsonStore");
const jsonStore = new RedisJsonStore(redisClient);

const { redisListStore } = require("../redisListStore");
const listStore = new redisListStore(redisClient);

const { RedisRoomStore } = require("../roomStore");
const redis_room = new RedisRoomStore(redisClient);


const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const BlackTeam = require("../schemas/roomTotal/BlackTeam");
const WhiteTeam = require("../schemas/roomTotal/WhiteTeam");
const BlackUsers = require("../schemas/roomTotal/BlackUsers");
const UserCompanyStatus = require("../schemas/roomTotal/UserCompanyStatus");
const WhiteUsers = require("../schemas/roomTotal/WhiteUsers");
const Company = require("../schemas/roomTotal/Company");
const Section = require("../schemas/roomTotal/Section");
const Progress = require("../schemas/roomTotal/Progress");
const RoomInfoTotal = require("../schemas/roomTotal/RoomInfoTotal");
const User = require("../schemas/roomTotal/User");
const RoomInfo = require("../schemas/roomTotal/RoomInfo");

const {lobbyLogger, gameLogger, chattingLogger} = require('../logConfig'); 
var server_ip = "128.0.0.1";

String.prototype.replaceAt = function(index, replacement) {
    if (index >= this.length) {
        return this.valueOf();
    }

    return this.substring(0, index) + replacement + this.substring(index + 1);
}

module.exports = async(io, socket) => {
    try{
        await sessionStore.saveSession(socket.sessionID, {
            userID: socket.userID,
            username: socket.nickname,
            connected: true,
        }).catch( 
        function (error) {
        console.log('catch handler', error);
        });

        lobbyLogger.info('mainHome:login', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : {status : 1} 
        });
    }catch(error){
        console.log("ERROR! ", error);
        console.log("connect: saveSession");
        lobbyLogger.error('mainHome:login', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : {status : -1} 
        });
    }

    console.log("connect: saveSession");
 

    socket.on('checkSession', () => {
        var session = { 
            sessionID: socket.sessionID,
            userID: socket.userID,
            nickname: socket.nickname,  
        };

        var sessionJSON= JSON.stringify(session);
        socket.emit("sessionInfo", sessionJSON);
    });


    // [MainHome] pin 번호 입력받아 현재 활성화된 방인지 검증함
    // [MainHome] 오픈 방 클릭시 
    socket.on("isValidRoom", async(room) => {

        var permission = await UpdatePermission(room);

        if(permission == 1){
            console.log('[socket-isValidRoom] UpdatePermission: 1');
            socket.room = room;
            socket.roomID  = JSON.parse(await redis_room.getRoomInfo(room)).roomID;
        }

        socket.emit('room permission',permission);

        lobbyLogger.info('mainHome:enter_room', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : {
                type : 'clickRoom', 
                roomID : socket.roomID,
                room : room,
                status : permission
          },
        });

    });


    // [MainHome] 랜덤 게임 시작 버튼 클릭시
    socket.on("randomGameStart", async() => {
        console.log('[randomGameStart]');
        var roomPin; 
        
        var publicRoomCnt = await listStore.lenList('publicRoom', 'roomManage');
        console.log("publicRoomCnt : ", publicRoomCnt);


        if(publicRoomCnt > 0){    
            var publicRoomList = await listStore.rangeList('publicRoom', 0, -1, 'roomManage');

            var randomNum = {};
            randomNum.random = function(n1, n2) {
                return parseInt(Math.random() * (n2 -n1 +1)) + n1;
            };

            var randomRoomIdx = randomNum.random(0,publicRoomCnt-1);
            var roomPin = publicRoomList[randomRoomIdx];
          
            socket.room = roomPin;
            socket.roomID  = JSON.parse(await redis_room.getRoomInfo(roomPin)).roomID;
            socket.emit('enterPublicRoom');

            lobbyLogger.info('mainHome:enter_room', {
                server : server_ip,
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userID,
                nickname : socket.nickname,
                data : {
                    type : 'randomGameStart', 
                    roomID : socket.roomID,
                    room : roomPin,
                    status : 1
              },
            });
        }else {
            var room_info = await createRoom('public', config.DEFAULT_ROOM.maxPlayer);
            
            lobbyLogger.info('mainHome:create_room', {
                server : server_ip,
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userID,
                nickname : socket.nickname,
                data : {
                    type : "randomGameStart",
                    roomID : room_info.roomID,
                    room : room_info.roomPin,
                    roomType : room_info.roomType,
                    maxPlayer : room_info.maxPlayer,
                    status : 1
              },
            });

        }    
        socket.room = room_info.roomPin;
        socket.roomID = room_info.roomID;
      
        socket.emit('enterPublicRoom');
    });


    // [MainHome] 룸 리스트 정보 반환 
    socket.on("getPublcRooms", async() => {
        var roomslist = await listStore.rangeList('publicRoom', 0, -1, 'roomManage');
        var publicRooms = []
        for (const room of roomslist){
            publicRooms.push({
                'roomPin' : room.toString(),
                'userCnt' : (await redis_room.RoomMembers_num(room)).toString(),
                'maxPlayer' : JSON.parse(await redis_room.getRoomInfo(room)).maxPlayer
            });               
        }   
    
        socket.emit('loadPublicRooms', publicRooms);
    });

    // [CreateRoom] 새 방을 만듦
    socket.on("createRoom", async(room) =>{
        var room_info= await createRoom(room.roomType, room.maxPlayer);

        socket.room = room_info.roomPin;
        socket.roomID = room_info.roomID;

        socket.emit('succesCreateRoom', {
            roomPin: room_info.roomPin.toString()
        });

        lobbyLogger.info('mainHome:create_room', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : {
                type : "createRoom",
                roomID : room_info.roomID,
                room : room_info.roomPin,
                roomType : room_info.roomType,
                maxPlayer : room_info.maxPlayer,
                status : 1
          },
        });
    
    });


    // [WaitingRoom] 사용자 첫 입장 시 'add user' emit 
    socket.on('add user', async() => {

        var room = socket.room;
    
        // 1. redis에서 room 정보 불러오기
        var roomManageDict = await hashtableStore.getAllHashTable(room, 'roomManage'); // 딕셔너리 형태
        console.log('!!!~~룸정보 roomManage', roomManageDict);

        // 2. new user를 white/black 배정 및 profile 색 지정 
        // 2-1. team배정
        var team;
        if (roomManageDict.blackUserCnt > roomManageDict.whiteUserCnt){
            ++roomManageDict.whiteUserCnt ;
            team = true;
        }else {
            ++roomManageDict.blackUserCnt ;
            team = false;
        }
        
        ++roomManageDict.userCnt; 
        

        // 만약 현재 방 인원이 꽉 찾으면 list에서 삭제해주기
        if (roomManageDict.userCnt >= roomManageDict.maxPlayer){
            var redisroomKey =  roomManageDict.roomType +'Room';
            listStore.delElementList(redisroomKey, 1, room, 'roomManage');
            console.log("roomManage의 list에서 삭제됨");
        }


        // 2-1. profile 배정
        const rand_Color = roomManageDict.profileColors.indexOf('0'); 
        roomManageDict.profileColors = roomManageDict.profileColors.replaceAt(rand_Color, '1');

        await hashtableStore.storeHashTable(room, roomManageDict, 'roomManage'); 
        
        let playerInfo = { userID: socket.userID, nickname: socket.nickname, team: team, status: 0, color: rand_Color, place : await PlaceUser(room, team), socketID : socket.id };
        
        // 3. socket.join, socket.color
        redis_room.addMember(socket.room, socket.userID, playerInfo);
        socket.team = team;
        socket.color = rand_Color;
        socket.join(room);

        // 4. 사용자 로그인 알림 (new user에게 모든 사용자의 정보를 push함) 
        // 해당 룸의 모든 사용자 정보 가져와 new user 정보 추가 후 update
        var RoomMembersList =  await redis_room.RoomMembers(socket.room);
        var RoomMembersDict = {}

        for (const member of RoomMembersList){
            RoomMembersDict[member] = await redis_room.getMember(room, member);
        }   

        var room_data = { 
            room : room,
            clientUserID : socket.userID,
            maxPlayer : roomManageDict.maxPlayer,
            users : RoomMembersDict
        };
        var roomJson = JSON.stringify(room_data);

        socket.emit('login',roomJson); 
 
        // 5. new user외의 사용자들에게 new user정보 보냄
        socket.broadcast.to(room).emit('user joined', JSON.stringify(playerInfo));

        lobbyLogger.info('waitingRoom:add_user', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : 
                {
                    roomID : socket.roomID,
                    room : room,
                    team: playerInfo.team,
                    color:playerInfo.color,
                    place : playerInfo.place,
                    status: playerInfo.status,
                    userCnt : roomManageDict.userCnt,
                    maxPlayer : roomManageDict.maxPlayer,
            },
        });

    });
    


    // [WaitingRoom] ready status 변경 시 
    socket.on('changeReadyStatus',  async(newStatus) =>{
        // 1. 사용자 정보 수정 
        var playerInfo = await redis_room.getMember(socket.room, socket.userID);
        playerInfo.status = newStatus;

        await redis_room.updateMember(socket.room, socket.userID, playerInfo);

        // 2. ready한 경우 room_info 바꿔주기 
        var roomInfo  = await hashtableStore.getHashTableFieldValue(socket.room, ['readyUserCnt', 'maxPlayer'], 'roomManage');
        var readyUserCnt = parseInt(roomInfo[0]);
        var maxPlayer =  parseInt(roomInfo[1]);

        if (newStatus == 1){
            readyUserCnt += 1
        }else {
            readyUserCnt -= 1
        }

        await hashtableStore.updateHashTableField(socket.room, 'readyUserCnt', readyUserCnt, 'roomManage'); 

        // 수정한 내용 client들에게 뿌리기
        var playerJson = JSON.stringify(playerInfo);
        io.sockets.in(socket.room).emit('updateUI',playerJson);

        lobbyLogger.info('waitingRoom:change_status', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : 
                {
                    roomID : socket.roomID,
                    room : socket.room,
                    team: playerInfo.team,
                    color:playerInfo.color,
                    place : playerInfo.place,
                    status: playerInfo.status,
                    readyUserCnt: readyUserCnt
            },
        });

        // 3. 만약 모두가 ready한 상태라면 자동 game start
       if(readyUserCnt == maxPlayer){
            io.sockets.in(socket.room).emit('countGameStart');

            lobbyLogger.info('waitingRoom:count_game_start ', {
                server : server_ip,
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userID,
                nickname : socket.nickname,
                data : 
                    {
                        readyUserCnt: readyUserCnt,
                        roomID : socket.roomID,
                        room : socket.room,
                },
            });

       }
    });


    // [WaitingRoom] profile 변경 시 
    socket.on('changeProfileColor',  async() =>{
        // 0. 이전의 사용자 정보의 프로필 색상 인덱스 가져옴
        var playerInfo = await redis_room.getMember(socket.room, socket.userID);
        var prevColorIndex = playerInfo.color;

        // 1. 룸 정보에서 가능한 프로필 색상 인덱스 가져오고 이전 프로필 인덱스는 0으로 만듦
        var profileColors = await hashtableStore.getHashTableFieldValue(socket.room, ['profileColors'], 'roomManage');
        profileColors = profileColors[0].replaceAt(prevColorIndex, '0'); // 이전 프로필 인덱스 0으로 설정
        
        const rand_Color = profileColors.indexOf('0', (prevColorIndex + 1)%12); // <확인필요> 새 프로필 인덱스 할당
        // 프로필 인덱스 최대를 넘어가도 앞으로 와서 반복되도독 하기
        if (rand_Color == -1){
            rand_Color = profileColors.indexOf('0');
        }
        profileColors = profileColors.replaceAt(rand_Color, '1');
        socket.color = rand_Color;

        await hashtableStore.updateHashTableField(socket.room, 'profileColors', profileColors, 'roomManage');

        // 2. 사용자 정보 수정 
        playerInfo.color = rand_Color;
        await redis_room.updateMember(socket.room, socket.userID, playerInfo);

        // 3. 수정한 내용을 요청한 사람 포함 모두에게 뿌리기
        var playerJson = JSON.stringify(playerInfo);
        io.sockets.in(socket.room).emit('updateUI',playerJson); 

        lobbyLogger.info('waitingRoom:change_profile', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : 
                {
                    roomID : socket.roomID,
                    room : socket.room,
                    team: playerInfo.team,
                    color:playerInfo.color,
                    place : playerInfo.place,
                    status: playerInfo.status
            },
        });
    });  



    // [WaitingRoom] teamChange 변경 시 
    socket.on('changeTeamStatus',  async(changeStatus) =>{
       var room = socket.room;

        // 1. 사용자 정보 (status)수정  
        var playerInfo = await redis_room.getMember(room, socket.userID);
        playerInfo.status = changeStatus;

        await redis_room.updateMember(room, socket.userID, playerInfo);
        io.sockets.in(socket.room).emit('updateUI',JSON.stringify(playerInfo));

        var prevTeam = playerInfo.team; 
        var prevPlace = playerInfo.place;

        // 2. status 상황에 따라 행동 다르게
        // 0이면 teamChange Off
        if (changeStatus == 0){     
            // 만약 대기에 있었다면 빼주기 
            var myWaitingField, mywaitingList;
            if(prevPlace){
                myWaitingField = 'toBlackUsers';
            }else{
                myWaitingField = 'toWhiteUsers';
            }
            var myWaitingData = await hashtableStore.getHashTableFieldValue(room, [myWaitingField], 'roomManage');

            // 널 처리
            if (myWaitingData[0].length != 0){
                mywaitingList = myWaitingData[0].split(',');
                mywaitingList = mywaitingList.filter(function(userID) {
                    return userID != socket.userID;
                });
                await hashtableStore.updateHashTableField(room, myWaitingField, mywaitingList.join(','), 'roomManage');
            }

            // 2-1. 수정한 내용 client들에게 뿌리기
            var playerJson = JSON.stringify(playerInfo);
            socket.broadcast.to(socket.room).emit('updateUI', playerJson);

            lobbyLogger.info('waitingRoom:switch_team_off ', {
                server : server_ip,
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userID,
                nickname : socket.nickname,
                data : 
                    {
                        roomID : socket.roomID,
                        room : socket.room,
                        team: playerInfo.team,
                        color:playerInfo.color,
                        place : playerInfo.place,
                        status: playerInfo.status
                },
            });

        }
        // 2이면 teamChange On
        else if(changeStatus == 2){
            // 0. redis에서 room 정보 불러오기
            var roomManageDict = await hashtableStore.getAllHashTable(room, 'roomManage');

            // 경우 1 : 다른 팀의 자리가 있어서 바로 변경 가능
            var limitedUser = parseInt(roomManageDict.maxPlayer / 2);
            if ((prevTeam == true &&  parseInt(roomManageDict.blackUserCnt) < limitedUser) || (prevTeam == false && parseInt(roomManageDict.whiteUserCnt) < limitedUser))
            {                
                // 1. room의 사용자 team 정보 바꾸기
                console.log("[case1] PlayersInfo : ", playerInfo);
                playerInfo.team = !prevTeam;
                socket.team = !prevTeam;;
                playerInfo.status = 0; 

                if(prevTeam){ // white팀이면
                    -- roomManageDict.whiteUserCnt ; 
                    ++ roomManageDict.blackUserCnt ; 
                }else{
                    // black팀이면
                    ++ roomManageDict.whiteUserCnt; 
                    -- roomManageDict.blackUserCnt ; 
                }

                // 수정사항 REDIS 저장
                await hashtableStore.storeHashTable(room, roomManageDict, 'roomManage');

                // UI 위치 할당
                await DeplaceUser(room, prevTeam, prevPlace);
                playerInfo.place = await PlaceUser(room, !prevTeam);
  
                // 수정사항 REDIS 저장
                await redis_room.updateMember(room, socket.userID, playerInfo);


                // 2. 바뀐 정보 클라쪽에 보내기
                var changeInfo = { 
                    type : 1,
                    player1 : playerInfo, 
                };

                var teamChangeInfo = JSON.stringify(changeInfo);
                io.sockets.in(socket.room).emit('updateTeamChange',teamChangeInfo);

                lobbyLogger.info('waitingRoom:switch_team_on1 ', {
                    server : server_ip,
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userID,
                    nickname : socket.nickname,
                    data : 
                        {
                            roomID : socket.roomID,
                            room : socket.room,
                            team: playerInfo.team,
                            color:playerInfo.color,
                            place : playerInfo.place,
                            status: playerInfo.status
                    },
                });
            }else{
                // 경우 2 : full 상태라 1:1로 팀 change를 해야되는 상황 
                // 경우 2-1 : 상대팀에서 팀 변경 원하는 사람이 있는지 확인 
                var othersWaitingField, myWaitingField;
                if (prevTeam){ 
                    //현재 팀 바꾸길 원하는 사용자가 화이트->블랙이므로, toWhiteUsers가 있는지 확인하기 
                    othersWaitingField = 'toWhiteUsers';
                    myWaitingField = 'toBlackUsers';
                }
                else{ 
                    othersWaitingField = 'toBlackUsers';
                    myWaitingField = 'toWhiteUsers';
                }

                var othersWaitingData = await hashtableStore.getHashTableFieldValue(room, [othersWaitingField], 'roomManage');
                var myWaitingData = await hashtableStore.getHashTableFieldValue(room, [myWaitingField], 'roomManage');
               
                // 널처리
                var otherswaitingList;
                var mywaitingList;

                if (othersWaitingData[0].length != 0){
                    otherswaitingList = othersWaitingData[0].split(',');
                }else{
                    otherswaitingList = []
                }

                if (myWaitingData[0].length != 0){
                    mywaitingList = myWaitingData[0].split(',');
                } else{
                    mywaitingList = []
                }
       
           
                // 맞교환할 사람이 없으면 웨이팅리스트에 추가
                if (otherswaitingList.length == 0){
                    mywaitingList.push(socket.userID);
                    await hashtableStore.updateHashTableField(room, myWaitingField, mywaitingList.join(','), 'roomManage');
                    
                    lobbyLogger.info('waitingRoom:switch_team_wait', {
                        server : server_ip,
                        userIP : '192.0.0.1',
                        sessionID : socket.sessionID,
                        userID : socket.userID,
                        nickname : socket.nickname,
                        data : 
                            {
                                roomID : socket.roomID,
                                room : socket.room,
                                team: playerInfo.team,
                                color:playerInfo.color,
                                place : playerInfo.place,
                                status: playerInfo.status
                        },
                    });
                
                }else{
                    // 1:1 교환 진행
                    var mateUserID = otherswaitingList.shift();
                    await hashtableStore.updateHashTableField(room, othersWaitingField, otherswaitingList.join(','), 'roomManage');
                    var matePlayerInfo = await redis_room.getMember(room, mateUserID);
               
                    // player간 자리 및 정보 교환
                    var tmp_place = playerInfo.place;

                    playerInfo.place = matePlayerInfo.place;
                    playerInfo.team = !playerInfo.team ;
                    playerInfo.status = 0;
                    socket.team = playerInfo.team;

                    matePlayerInfo.place = tmp_place;
                    matePlayerInfo.team = !matePlayerInfo.team ;
                    matePlayerInfo.status = 0;

                    await redis_room.updateMember(room, socket.userID, playerInfo);
                    await redis_room.updateMember(room, mateUserID, matePlayerInfo);

                    //  바뀐 정보 클라쪽에 보내기
                    var changeInfo = { 
                        type : 2,
                        player1 : playerInfo, 
                        player2 : matePlayerInfo
                    };

                    var teamChangeInfo = JSON.stringify(changeInfo);
                    io.sockets.in(socket.room).emit('updateTeamChange',teamChangeInfo);
                    
                    // 상대방 socketID로 1:1로 보냄 
                    io.to(matePlayerInfo.socketID).emit('onTeamChangeType2');

                    lobbyLogger.info('waitingRoom:switch_team_on2_1 ', {
                        server : server_ip,
                        userIP : '192.0.0.1',
                        sessionID : socket.sessionID,
                        userID : socket.userID,
                        nickname : socket.nickname,
                        data : 
                            {
                                roomID : socket.roomID,
                                room : socket.room,
                                team: playerInfo.team,
                                color:playerInfo.color,
                                place : playerInfo.place,
                                status: playerInfo.status
                        },
                    });
                }

            }
        }
    });  

    socket.on('updateSocketTeam',async()=> {
        socket.team = !socket.team;

        var playerInfo = await redis_room.getMember(socket.room, socket.userID);
        lobbyLogger.info('waitingRoom:switch_team_on2_2 ', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : 
                {
                    roomID : socket.roomID,
                    room : socket.room,
                    team: playerInfo.team,
                    color:playerInfo.color,
                    place : playerInfo.place,
                    status: playerInfo.status
            },
        });
    });

    // [WaitingRoom] WaitingRoom에서 나갈 시 (홈버튼 클릭)
    socket.on('leaveRoom', async()=> {
        var roomPin = socket.room;
        await leaveRoom(socket, roomPin);
    });


    // [WaitingRoom] 게임 스타트 누를 시에 모든 유저에게 전달
    socket.on('Game Start',  async() =>{
        // 사용자 정보 팀 별로 불러오기
        var blackUsersInfo = []; 
        var whiteUsersInfo = [];
        let infoJson = {};
        
        var RoomMembersList =  await redis_room.RoomMembers(socket.room);
        for (const member of RoomMembersList){
            var playerInfo = await redis_room.getMember(socket.room, member);
            if (playerInfo.team == false) {
                infoJson = {UsersID : playerInfo.userID, UsersProfileColor : playerInfo.color}
                blackUsersInfo.push(infoJson);
            }
            else {
                infoJson = {UsersID : playerInfo.userID, UsersProfileColor : playerInfo.color}
                whiteUsersInfo.push(infoJson);
            }
        }
      
        // 게임 관련 Json 생성 (new)
        var roomTotalJson = InitGame(socket.room, blackUsersInfo, whiteUsersInfo);

        // monitoringLog 생성
        var monitoringLog = [];
        jsonStore.storejson(monitoringLog, socket.room+":blackLog");
        jsonStore.storejson(monitoringLog, socket.room+":whiteLog");
   
        // redis에 저징
        io.sockets.in(socket.room).emit('onGameStart'); 

        lobbyLogger.info('waitingRoom:game_start_on', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : 
                {
                    roomID : socket.roomID,
                    room : socket.room,
                    team: playerInfo.team,
            },
        });
    });

    //  [WaitingRoom] GameStart로 모든 클라이언트의 on을 받는 함수로 팀별로 room join하여 씬 이동함 
    socket.on('joinTeam', async() => {
        // 팀별로 ROOM 추가 join
        socket.roomTeam = socket.room + socket.team.toString();
        socket.join(socket.roomTeam);

        socket.emit('loadMainGame', socket.team.toString()); //ver3
  
        lobbyLogger.info('waitingRoom:game_start_join_team', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : 
                {
                    roomID : socket.roomID,
                    room : socket.room,
                    team: socket.team,
            },
        });
    
    });

    
    // [room] 방 키 5자리 랜덤 
    function randomN(){
        var randomNum = {};

        //0~9까지의 난수
        randomNum.random = function(n1, n2) {
            return parseInt(Math.random() * (n2 -n1 +1)) + n1;
        };
    
        var value = "";
        for(var i=0; i<5; i++){
            value += randomNum.random(0,9);
        }

        return value;
    };

     // 현재 날짜 문자열 생성
     function nowDate(){
        var today = new Date();
        var year = today.getFullYear();
        var month = ('0' + (today.getMonth() + 1)).slice(-2);
        var day = ('0' + today.getDate()).slice(-2);
        
        var today = new Date();   
        var hours = ('0' + today.getHours()).slice(-2); 
        var minutes = ('0' + today.getMinutes()).slice(-2);
        var seconds = ('0' + today.getSeconds()).slice(-2); 
        
        var dateString = year + '-' + month  + '-' + day;
        var timeString = hours + ':' + minutes  + ':' + seconds;
    
        var now_date = dateString + " " + timeString;
        return now_date;
    }

    // [WaitingRoom] UI player 대응 컴포넌트 idx 할당
    async function PlaceUser(roomPin, team){
        var userPlacementName ;

        if(!team){ //false(0)면 black
            userPlacementName =  'blackPlacement';
        }else{
            userPlacementName =  'whitePlacement';
        } 

        var userPlacement =await hashtableStore.getHashTableFieldValue(roomPin, [userPlacementName], 'roomManage');
        if(!userPlacement)
        {
            return -1
        }

        userPlacement = userPlacement[0].split('');
        var place =  userPlacement.pop();
        var newUserPlacement =  userPlacement.join('');

        await hashtableStore.updateHashTableField(roomPin, userPlacementName, newUserPlacement, 'roomManage');
        return place
    }

    // [WaitingRoom] UI player 대응 컴포넌트 idx 제거
    async function DeplaceUser(roomPin, prevTeam, idx){
        var userPlacementName ;

        if(!prevTeam){ // false(0) 면 black팀
            userPlacementName =  'blackPlacement';
        }else{
            userPlacementName =  'whitePlacement';
        }

        var userPlacement = await hashtableStore.getHashTableFieldValue(roomPin, [userPlacementName], 'roomManage');
        userPlacement = userPlacement[0].split('');
        userPlacement.push(idx);
        userPlacement =  userPlacement.join('');
        
        await hashtableStore.updateHashTableField(roomPin, userPlacementName, userPlacement, 'roomManage');
    }

    async function createRoom(roomType, maxPlayer){
        //  1. redis - room에 저장
        var roomPin = randomN();
        var roomID = randomId();
        while (redis_room.checkRooms(roomPin))
        {
            roomPin = randomN();
        }


        var creationDate = nowDate();

        var room_info = {
            roomID : roomID,
            roomPin : roomPin,
            creationDate : creationDate,
            roomType : roomType,
            maxPlayer : maxPlayer
        };

        await redis_room.createRoom(roomPin, room_info);

        // 2. redis - roomManage/'roomKey' 저장
        var room_info_redis = {
            'roomID' : roomID,
            'roomType' : roomType,
            'creationDate' : creationDate,
            'maxPlayer' : maxPlayer,
            'userCnt' : 0,
            'readyUserCnt' : 0,
            'whiteUserCnt' : 0,
            'blackUserCnt' : 0,
            'blackPlacement' : config.ALLOCATE_PLAYER_UI[maxPlayer],
            'whitePlacement' : config.ALLOCATE_PLAYER_UI[maxPlayer],
            'toBlackUsers' : [],
            'toWhiteUsers' : [],
            'profileColors' : '000000000000'
        };

        hashtableStore.storeHashTable(roomPin, room_info_redis, 'roomManage');

        // 3. redis - roomManage/publicRoom 또는 roomManage/privateRoom 에 저장
        var redisroomKey =  roomType +'Room';
        listStore.rpushList(redisroomKey, roomPin, false, 'roomManage');

        return room_info
    };


    // 공개방/비공개 방 들어갈 수 있는지 확인 (검증 : 룸 존재 여부, 룸 full 여부)
    async function UpdatePermission(roomPin){
        // 1. 해당 룸 핀이 있는지 확인
        if (! await redis_room.IsValidRoom(roomPin)) { 
            return -1
        }

        // 2. 해당 룸에 들어갈 수 있는지 (full상태 확인)
        if (await redis_room.RoomMembers_num(roomPin) >= JSON.parse(await redis_room.getRoomInfo(roomPin)).maxPlayer){
            return 0
        }

        return 1
    };

    // 방 나가는  함수
    async function leaveRoom(socket, roomPin){

        // 1. 해당 인원이 나가면 room null인지 확인 (user 0명인 경우 룸 삭제)
        if (await redis_room.RoomMembers_num(roomPin) <= 1){
            // 1) redis 기본 room 삭제
            redis_room.deleteRooms(roomPin); 

            var redisroomKey = await hashtableStore.getHashTableFieldValue(roomPin, ['roomType'], 'roomManage'); // 3번 과정을 위해 roomType 가져오기

            // 2) roomManage room 삭제
            hashtableStore.deleteHashTable(roomPin,'roomManage');
            // 3) roomManage list에서 삭제
            listStore.delElementList(redisroomKey[0] + 'Room', 0, roomPin, 'roomManage'); 
              
            // 2. 방에 emit하기 (나갈려고 하는 사용자에게 보냄)
            socket.emit('logout'); 

            // 3. 방에 emit하기 (그 외 다른 사용자들에게 나간 사람정보 보냄
            socket.broadcast.to(roomPin).emit('userLeaved',socket.userID);  
    
            // 4. (join삭제) 
            socket.leave(roomPin);

            lobbyLogger.info('mainHome:delete_room', {
                server : server_ip,
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userID,
                nickname : socket.nickname,
                data :  {
                    roomID : socket.roomID,
                    room : socket.room,
                }
            });
        }
        else{  
            // 1) roomManage room 인원 수정
            // 주의! DeplaceUser부터 해줘야함
            var userInfo = await redis_room.getMember(socket.room, socket.userID);
            if (socket.team){
                await DeplaceUser(roomPin, socket.team, userInfo.place); 
            }else{
                await DeplaceUser(roomPin, socket.team, userInfo.place);  
            }
            
            var roomManageInfo = await hashtableStore.getAllHashTable(roomPin, 'roomManage'); ;


            // userCnt 변경
            // blackUserCnt/whiteUserCnt 변경
            // toBlackUsers, toWhiteUsers 초기화
            roomManageInfo.userCnt = roomManageInfo.userCnt - 1;
            var othersWaitingField, myWaitingField;

            if (socket.team){
                roomManageInfo.whiteUserCnt = roomManageInfo.whiteUserCnt - 1;
                myWaitingField = 'toBlackUsers';
                othersWaitingField = 'toWhiteUsers';
            }else{
                roomManageInfo.blackUserCnt = roomManageInfo.blackUserCnt - 1;
                myWaitingField = 'toWhiteUsers';
                othersWaitingField = 'toBlackUsers';
            }
          
            // 만약 해당 유저가 웨이팅리스트에 있었다면 삭제함
            if(roomManageInfo[myWaitingField].length != 0){
                var mywaitingList = roomManageInfo[myWaitingField].split(',');
                roomManageInfo[myWaitingField] = mywaitingList.filter(function(userID) {
                    return userID != socket.userID;
                });
            }

            // profileColor 변경 
            roomManageInfo.profileColors = roomManageInfo.profileColors.replaceAt(socket.color, '0');

            // readycnt 변경 
            if(userInfo.status == 1){
                roomManageInfo.readyUserCnt -= 1 ;
            }
       
            await hashtableStore.storeHashTable(roomPin, roomManageInfo, 'roomManage');

            // 2)  Redis - room 인원에서 삭제
            redis_room.delMember(roomPin, socket.userID);

            // 2. 방에 emit하기 (나갈려고 하는 사용자에게 보냄)
            socket.emit('logout'); 

            // 3. 방에 emit하기 (그 외 다른 사용자들에게 나간 사람정보 보냄_
            socket.broadcast.to(roomPin).emit('userLeaved',socket.userID);  
    
            // 4. (join삭제) 
            socket.leave(roomPin);

            // 후속 처리
            // 3) 다른 유저의 teamChange 가능한지 확인 후 정보 저장
            var otherswaitingList;
            if(roomManageInfo[othersWaitingField].length != 0){
                otherswaitingList = othersWaitingData[0].split(',');

                var mateUserID = otherswaitingList.shift();
                var matePlayerInfo = await redis_room.getMember(room, mateUserID);

                matePlayerInfo.place = userInfo.place;
                matePlayerInfo.team = userInfo.team ;
                matePlayerInfo.status = 0;
                await redis_room.updateMember(room, mateUserID, matePlayerInfo);

                var teamChangeInfo = { 
                    type : 1,
                    player1 : matePlayerInfo
                };
                
                // teamchange 정보 보내기 
                io.sockets.in(socket.room).emit('updateTeamChange', JSON.stringify(teamChangeInfo));
            }

            // 3) roomManage list 인원 확인 (함수로 따로 빼기)
            // 만약 해당 룸이 full이 아니면 list에 추가해주기
            var redisroomKey =  roomManageInfo.roomType + 'Room';
            var publicRoomList = await listStore.rangeList(redisroomKey, 0, -1, 'roomManage');

            if (!publicRoomList.includes(roomPin) && (await redis_room.RoomMembers_num(roomPin) <= JSON.parse(await redis_room.getRoomInfo(roomPin)).maxPlayer)){
                await listStore.rpushList(redisroomKey, roomPin, false, 'roomManage');
            }

        }
        
        lobbyLogger.info('mainHome:leave_room', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data :  {
                roomID : socket.roomID,
                room : socket.room,
            }
        });

        // 5. 나머지 room 관련 정보 socket에서 삭제 및 빈 값으로 수정
        socket.room = null;
        socket.roomID = null;
        socket.team = null;
        socket.color = null;
    };

    // [GameStart] 게임시작을 위해 게임 스키마 초기화 
    function InitGame(room_key, blackUsersInfo, whiteUsersInfo){
        // RoomTotalJson 생성 및 return 
        var blackUsers = {};
        var whiteUsers = {};

        for (const user of blackUsersInfo){
            blackUsers[user.UsersID] = new BlackUsers({
                userId   : user.UsersID,
                profileColor : user.UsersProfileColor,
                currentLocation : "",
            });
        }

        for (const user of whiteUsersInfo){
            whiteUsers[user.UsersID] =  new WhiteUsers({
                userId   : user.UsersID,
                profileColor : user.UsersProfileColor,
                currentLocation : ""
            })
        }
    

        var initCompanyArray = []
        for (var i = 0; i < 5; i++){
            var initCompany = new Company({
                abandonStatus : false,
                penetrationTestingLV : [0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 14개 
                attackLV : [0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // 유형레벨 14가지
                defenseActive: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]], // 활성화된 방어
                beActivated : [],
                sections : [
                    new Section({
                        attackable : true,
                        defensible : true,
                        destroyStatus : true ,
                        level  : 1,
                        suspicionCount : 0,
                        attackProgress : [],
                        attackSenarioProgress  : [[], [], [], [], []],
                        defenseProgress : [[], [], [], [], []],
                        defenseLv : [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]], // 방어 레벨 
                        defenseCnt : [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]], // 방어 횟수 
                        attackConn : [
                            // scenario 1
                            { 
                                'startAttack' : {'Gather Victim Network Information' : false},
                                'Gather Victim Network Information': {"Exploit Public-Facing Application" : false, "Phishing" : false, "Valid Accounts" : false},
                                'Exploit Public-Facing Application' :  {"Command and Scripting Interpreter" : false, "Software Deployment Tools": false},
                                'Phishing' : {"Command and Scripting Interpreter" : false, "Software Deployment Tools" : false},
                                'Valid Accounts' : {"Command and Scripting Interpreter": false, "Software Deployment Tools": false},
                                'Command and Scripting Interpreter' : {"Account Manipulation": false, "Scheduled Task,Job": false},
                                'Software Deployment Tools' : {"Account Manipulation": false, "Scheduled Task,Job": false},
                                'Account Manipulation' : {"Abuse Elevation Control Mechanism": false, "Indirect Command Execution": false},
                                'Scheduled Task,Job' : {"Screen Capture": false,"Exfiltration Over Alternative Protocol": false,"Exfiltration Over Web Service": false},
                                'Abuse Elevation Control Mechanism' : {"Brute Force": false, "Account Discovery": false},
                                'Indirect Command Execution' : {"Brute Force": false},
                                'Screen Capture' : {"Communication Through Removable Media": false},
                                'Exfiltration Over Alternative Protocol' : {"Data Encrypted for Impact": false},
                                'Exfiltration Over Web Service' : {"Data Encrypted for Impact": false}
                            },
                            // scenario 2 
                            {
                                'startAttack' : {'Obtain Capabilities' : false},
                                "Obtain Capabilities" : {"Drive-by Compromise" : false, "Native API" : false},
                                "Drive-by Compromise" : {"Native API": false},
                                "Native API" : {"Modify Registry": false},
                                "Modify Registry" : {"Brute Force": false},
                                "Brute Force" : {"Browser Bookmark Discovery": false, "File and Directory Discovery": false, "Network Share Discovery": false, "Process Discovery": false,  "System Information Discovery": false, "System Network Configuration Discovery": false, "System Network Connections Discovery": false},
                                "Browser Bookmark Discovery" : {"Clipboard Data": false},
                                "File and Directory Discovery" : {"Data from Local System": false},
                                "Network Share Discovery" : {"Data from Local System": false},
                                "Process Discovery"  : {"Data from Local System": false},
                                "System Information Discovery" : {"Clipboard Data": false},
                                "System Network Configuration Discovery" : {"Data from Local System": false},
                                "System Network Connections Discovery": {"Data from Local System": false},
                                "Clipboard Data" : {"Ingress Tool Transfer": false,  "System Shutdown,Reboot": false},
                                "Data from Local System" : {"Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown,Reboot" : false},
                            },

                            // scenario 3
                            {
                                "startAttack" : {"Gather Victim Org Information" : false, "Search Victim-Owned Websites" : false},
                                "Gather Victim Org Information" : {"Exploit Public-Facing Application": false, "External Remote Services" : false},
                                "Search Victim-Owned Websites" : {"Develop Capabilities": false},
                                "Develop Capabilities" : {"Exploit Public-Facing Application": false, "External Remote Services" : false},
                                "Exploit Public-Facing Application" : {"Account Manipulation": false},
                                "External Remote Services" : {"Account Manipulation": false, "Browser Extensions": false},
                                "Account Manipulation" :  {"Process Injection": false},
                                "Browser Extensions" :  {"Process Injection": false},
                                "Process Injection" : {"Deobfuscate,Decode Files or Information": false,"Multi-Factor Authentication Interception": false, "Masquerading": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate,Decode Files or Information" : {"Multi-Factor Authentication Interception": false},
                                "Masquerading" : { "Network Sniffing": false},
                                "Modify Registry" : {"Query Registry": false},
                                "Obfuscated Files or Information" : {"System Information Discovery": false, "System Network Configuration Discovery": false, "System Service Discovery": false},
                                "Multi-Factor Authentication Interception" : {"File and Directory Discovery": false, "Process Discovery": false},
                                "File and Directory Discovery" : {"Internal Spearphishing": false, "Data from Local System": false},
                                "Network Sniffing": {"Internal Spearphishing": false}, 
                                "Process Discovery" :{"Data from Local System": false},
                                "Query Registry":{"Data from Local System": false}, 
                                "System Information Discovery" : {"Remote Access Software": false},
                                "System Network Configuration Discovery": {"Remote Access Software": false},
                                "System Service Discovery" : {"Ingress Tool Transfer": false},
                                "Internal Spearphishing": {"Adversary-in-the-Middle": false, "Data from Local System": false,"Exfiltration Over C2 Channel": false},
                                "Adversary-in-the-Middle" : {"Remote Access Software": false}, 
                                "Data from Local System": {"Ingress Tool Transfer": false}
                            
                            },

                            // scenario 4
                            {
                                "startAttack" : {"Drive-by Compromise" : false},
                                "Drive-by Compromise" : {"Native API": false},
                                "Native API" : {"Modify Registry": false},
                                "Modify Registry" : {"Brute Force": false,"Browser Bookmark Discovery": false, "File and Directory Discovery": false, "Network Share Discovery": false, "Process Discovery": false, "System Information Discovery": false, "System Network Connections Discovery": false, "System Owner,User Discovery": false},
                                "Browser Bookmark Discovery" :  {"Clipboard Data": false},
                                "File and Directory Discovery":  {"Clipboard Data": false},
                                "Network Share Discovery":  {"Data from Local System": false},
                                "Process Discovery":  {"Data from Local System": false}, 
                                "System Information Discovery":  {"Data from Local System": false},
                                "System Network Connections Discovery":  {"Data from Local System": false},
                                "System Owner,User Discovery":  {"Data from Local System": false},
                                "Clipboard Data":  {"System Shutdown,Reboot": false },
                                "Data from Local System" :  {"Ingress Tool Transfer": false, "Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown,Reboot": false }
                            },

                            // scenario 5
                            {
                                "startAttack" : {"Drive-by Compromise" : false, "Exploit Public-Facing Application" : false},
                                "Drive-by Compromise": {"Windows Management Instrumentation": false},
                                "Exploit Public-Facing Application": {"Windows Management Instrumentation": false},
                                "Windows Management Instrumentation" :{"Scheduled Task,Job": false},
                                "Scheduled Task,Job" : {"Deobfuscate,Decode Files or Information": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate,Decode Files or Information" : {"Domain Trust Discovery": false, "System Network Configuration Discovery": false,  "System Owner,User Discovery" : false },
                                "Modify Registry" : {"Process Discovery": false},
                                "Obfuscated Files or Information"  : {"Remote System Discovery": false, "System Network Configuration Discovery": false, "System Network Connections Discovery": false, "System Owner,User Discovery": false, "System Service Discovery": false },
                                "Domain Trust Discovery" : {"Proxy": false},
                                "Process Discovery" : {"Proxy": false},
                                "Remote System Discovery" : {"Exploitation of Remote Services": false},
                                "System Network Configuration Discovery": {"Proxy": false},
                                "System Network Connections Discovery":{"Proxy": false},
                                "System Owner,User Discovery":{"Proxy": false},
                                "System Service Discovery": {"Proxy": false},
                            }
                        ]
                    }),
    
                    new Section({
                        attackable : true,
                        defensible : true,
                        destroyStatus : true ,
                        level  : 1,
                        suspicionCount : 0,
                        attackProgress : [],
                        attackSenarioProgress  : [[], [], [], [], []],
                        defenseProgress : [[], [], [], [], []],
                        defenseLv : [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]], // 방어 레벨 
                        defenseCnt : [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]], // 방어 횟수 
                        attackConn : [
                            // scenario 1
                            { 
                                'startAttack' : {'Gather Victim Network Information' : false},
                                'Gather Victim Network Information': {"Exploit Public-Facing Application" : false, "Phishing" : false, "Valid Accounts" : false},
                                'Exploit Public-Facing Application' :  {"Command and Scripting Interpreter" : false, "Software Deployment Tools": false},
                                'Phishing' : {"Command and Scripting Interpreter" : false, "Software Deployment Tools" : false},
                                'Valid Accounts' : {"Command and Scripting Interpreter": false, "Software Deployment Tools": false},
                                'Command and Scripting Interpreter' : {"Account Manipulation": false, "Scheduled Task,Job": false},
                                'Software Deployment Tools' : {"Account Manipulation": false, "Scheduled Task,Job": false},
                                'Account Manipulation' : {"Abuse Elevation Control Mechanism": false, "Indirect Command Execution": false},
                                'Scheduled Task,Job' : {"Screen Capture": false,"Exfiltration Over Alternative Protocol": false,"Exfiltration Over Web Service": false},
                                'Abuse Elevation Control Mechanism' : {"Brute Force": false, "Account Discovery": false},
                                'Indirect Command Execution' : {"Brute Force": false},
                                'Screen Capture' : {"Communication Through Removable Media": false},
                                'Exfiltration Over Alternative Protocol' : {"Data Encrypted for Impact": false},
                                'Exfiltration Over Web Service' : {"Data Encrypted for Impact": false}
                            },
                            // scenario 2 
                            {
                                'startAttack' : {'Obtain Capabilities' : false},
                                "Obtain Capabilities" : {"Drive-by Compromise" : false, "Native API" : false},
                                "Drive-by Compromise" : {"Native API": false},
                                "Native API" : {"Modify Registry": false},
                                "Modify Registry" : {"Brute Force": false},
                                "Brute Force" : {"Browser Bookmark Discovery": false, "File and Directory Discovery": false, "Network Share Discovery": false, "Process Discovery": false,  "System Information Discovery": false, "System Network Configuration Discovery": false, "System Network Connections Discovery": false},
                                "Browser Bookmark Discovery" : {"Clipboard Data": false},
                                "File and Directory Discovery" : {"Data from Local System": false},
                                "Network Share Discovery" : {"Data from Local System": false},
                                "Process Discovery"  : {"Data from Local System": false},
                                "System Information Discovery" : {"Clipboard Data": false},
                                "System Network Configuration Discovery" : {"Data from Local System": false},
                                "System Network Connections Discovery": {"Data from Local System": false},
                                "Clipboard Data" : {"Ingress Tool Transfer": false,  "System Shutdown,Reboot": false},
                                "Data from Local System" : {"Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown,Reboot" : false},
                            },

                            // scenario 3
                            {
                                "startAttack" : {"Gather Victim Org Information" : false, "Search Victim-Owned Websites" : false},
                                "Gather Victim Org Information" : {"Exploit Public-Facing Application": false, "External Remote Services" : false},
                                "Search Victim-Owned Websites" : {"Develop Capabilities": false},
                                "Develop Capabilities" : {"Exploit Public-Facing Application": false, "External Remote Services" : false},
                                "Exploit Public-Facing Application" : {"Account Manipulation": false},
                                "External Remote Services" : {"Account Manipulation": false, "Browser Extensions": false},
                                "Account Manipulation" :  {"Process Injection": false},
                                "Browser Extensions" :  {"Process Injection": false},
                                "Process Injection" : {"Deobfuscate,Decode Files or Information": false,"Multi-Factor Authentication Interception": false, "Masquerading": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate,Decode Files or Information" : {"Multi-Factor Authentication Interception": false},
                                "Masquerading" : { "Network Sniffing": false},
                                "Modify Registry" : {"Query Registry": false},
                                "Obfuscated Files or Information" : {"System Information Discovery": false, "System Network Configuration Discovery": false, "System Service Discovery": false},
                                "Multi-Factor Authentication Interception" : {"File and Directory Discovery": false, "Process Discovery": false},
                                "File and Directory Discovery" : {"Internal Spearphishing": false, "Data from Local System": false},
                                "Network Sniffing": {"Internal Spearphishing": false}, 
                                "Process Discovery" :{"Data from Local System": false},
                                "Query Registry":{"Data from Local System": false}, 
                                "System Information Discovery" : {"Remote Access Software": false},
                                "System Network Configuration Discovery": {"Remote Access Software": false},
                                "System Service Discovery" : {"Ingress Tool Transfer": false},
                                "Internal Spearphishing": {"Adversary-in-the-Middle": false, "Data from Local System": false,"Exfiltration Over C2 Channel": false},
                                "Adversary-in-the-Middle" : {"Remote Access Software": false}, 
                                "Data from Local System": {"Ingress Tool Transfer": false}
                            
                            },

                            // scenario 4
                            {
                                "startAttack" : {"Drive-by Compromise" : false},
                                "Drive-by Compromise" : {"Native API": false},
                                "Native API" : {"Modify Registry": false},
                                "Modify Registry" : {"Brute Force": false,"Browser Bookmark Discovery": false, "File and Directory Discovery": false, "Network Share Discovery": false, "Process Discovery": false, "System Information Discovery": false, "System Network Connections Discovery": false, "System Owner,User Discovery": false},
                                "Browser Bookmark Discovery" :  {"Clipboard Data": false},
                                "File and Directory Discovery":  {"Clipboard Data": false},
                                "Network Share Discovery":  {"Data from Local System": false},
                                "Process Discovery":  {"Data from Local System": false}, 
                                "System Information Discovery":  {"Data from Local System": false},
                                "System Network Connections Discovery":  {"Data from Local System": false},
                                "System Owner,User Discovery":  {"Data from Local System": false},
                                "Clipboard Data":  {"System Shutdown,Reboot": false },
                                "Data from Local System" :  {"Ingress Tool Transfer": false, "Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown,Reboot": false }
                            },

                            // scenario 5
                            {
                                "startAttack" : {"Drive-by Compromise" : false, "Exploit Public-Facing Application" : false},
                                "Drive-by Compromise": {"Windows Management Instrumentation": false},
                                "Exploit Public-Facing Application": {"Windows Management Instrumentation": false},
                                "Windows Management Instrumentation" :{"Scheduled Task,Job": false},
                                "Scheduled Task,Job" : {"Deobfuscate,Decode Files or Information": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate,Decode Files or Information" : {"Domain Trust Discovery": false, "System Network Configuration Discovery": false,  "System Owner,User Discovery" : false },
                                "Modify Registry" : {"Process Discovery": false},
                                "Obfuscated Files or Information"  : {"Remote System Discovery": false, "System Network Configuration Discovery": false, "System Network Connections Discovery": false, "System Owner,User Discovery": false, "System Service Discovery": false },
                                "Domain Trust Discovery" : {"Proxy": false},
                                "Process Discovery" : {"Proxy": false},
                                "Remote System Discovery" : {"Exploitation of Remote Services": false},
                                "System Network Configuration Discovery": {"Proxy": false},
                                "System Network Connections Discovery":{"Proxy": false},
                                "System Owner,User Discovery":{"Proxy": false},
                                "System Service Discovery": {"Proxy": false},
                            }
                        ]
                    }),
    
                    new Section({
                        attackable : true,
                        defensible : true,
                        destroyStatus : false ,
                        level  : 1,
                        suspicionCount : 0,
                        attackProgress : [],
                        attackSenarioProgress  : [[], [], [], [], []],
                        defenseProgress : [[], [], [], [], []],
                        defenseLv : [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]], // 방어 레벨 
                        defenseCnt : [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]], // 방어 횟수 
                        attackConn : [
                            // scenario 1
                            { 
                                'startAttack' : {'Gather Victim Network Information' : false},
                                'Gather Victim Network Information': {"Exploit Public-Facing Application" : false, "Phishing" : false, "Valid Accounts" : false},
                                'Exploit Public-Facing Application' :  {"Command and Scripting Interpreter" : false, "Software Deployment Tools": false},
                                'Phishing' : {"Command and Scripting Interpreter" : false, "Software Deployment Tools" : false},
                                'Valid Accounts' : {"Command and Scripting Interpreter": false, "Software Deployment Tools": false},
                                'Command and Scripting Interpreter' : {"Account Manipulation": false, "Scheduled Task,Job": false},
                                'Software Deployment Tools' : {"Account Manipulation": false, "Scheduled Task,Job": false},
                                'Account Manipulation' : {"Abuse Elevation Control Mechanism": false, "Indirect Command Execution": false},
                                'Scheduled Task,Job' : {"Screen Capture": false,"Exfiltration Over Alternative Protocol": false,"Exfiltration Over Web Service": false},
                                'Abuse Elevation Control Mechanism' : {"Brute Force": false, "Account Discovery": false},
                                'Indirect Command Execution' : {"Brute Force": false},
                                'Screen Capture' : {"Communication Through Removable Media": false},
                                'Exfiltration Over Alternative Protocol' : {"Data Encrypted for Impact": false},
                                'Exfiltration Over Web Service' : {"Data Encrypted for Impact": false}
                            },
                            // scenario 2 
                            {
                                'startAttack' : {'Obtain Capabilities' : false},
                                "Obtain Capabilities" : {"Drive-by Compromise" : false, "Native API" : false},
                                "Drive-by Compromise" : {"Native API": false},
                                "Native API" : {"Modify Registry": false},
                                "Modify Registry" : {"Brute Force": false},
                                "Brute Force" : {"Browser Bookmark Discovery": false, "File and Directory Discovery": false, "Network Share Discovery": false, "Process Discovery": false,  "System Information Discovery": false, "System Network Configuration Discovery": false, "System Network Connections Discovery": false},
                                "Browser Bookmark Discovery" : {"Clipboard Data": false},
                                "File and Directory Discovery" : {"Data from Local System": false},
                                "Network Share Discovery" : {"Data from Local System": false},
                                "Process Discovery"  : {"Data from Local System": false},
                                "System Information Discovery" : {"Clipboard Data": false},
                                "System Network Configuration Discovery" : {"Data from Local System": false},
                                "System Network Connections Discovery": {"Data from Local System": false},
                                "Clipboard Data" : {"Ingress Tool Transfer": false,  "System Shutdown,Reboot": false},
                                "Data from Local System" : {"Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown,Reboot" : false},
                            },

                            // scenario 3
                            {
                                "startAttack" : {"Gather Victim Org Information" : false, "Search Victim-Owned Websites" : false},
                                "Gather Victim Org Information" : {"Exploit Public-Facing Application": false, "External Remote Services" : false},
                                "Search Victim-Owned Websites" : {"Develop Capabilities": false},
                                "Develop Capabilities" : {"Exploit Public-Facing Application": false, "External Remote Services" : false},
                                "Exploit Public-Facing Application" : {"Account Manipulation": false},
                                "External Remote Services" : {"Account Manipulation": false, "Browser Extensions": false},
                                "Account Manipulation" :  {"Process Injection": false},
                                "Browser Extensions" :  {"Process Injection": false},
                                "Process Injection" : {"Deobfuscate,Decode Files or Information": false,"Multi-Factor Authentication Interception": false, "Masquerading": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate,Decode Files or Information" : {"Multi-Factor Authentication Interception": false},
                                "Masquerading" : { "Network Sniffing": false},
                                "Modify Registry" : {"Query Registry": false},
                                "Obfuscated Files or Information" : {"System Information Discovery": false, "System Network Configuration Discovery": false, "System Service Discovery": false},
                                "Multi-Factor Authentication Interception" : {"File and Directory Discovery": false, "Process Discovery": false},
                                "File and Directory Discovery" : {"Internal Spearphishing": false, "Data from Local System": false},
                                "Network Sniffing": {"Internal Spearphishing": false}, 
                                "Process Discovery" :{"Data from Local System": false},
                                "Query Registry":{"Data from Local System": false}, 
                                "System Information Discovery" : {"Remote Access Software": false},
                                "System Network Configuration Discovery": {"Remote Access Software": false},
                                "System Service Discovery" : {"Ingress Tool Transfer": false},
                                "Internal Spearphishing": {"Adversary-in-the-Middle": false, "Data from Local System": false,"Exfiltration Over C2 Channel": false},
                                "Adversary-in-the-Middle" : {"Remote Access Software": false}, 
                                "Data from Local System": {"Ingress Tool Transfer": false}
                            
                            },

                            // scenario 4
                            {
                                "startAttack" : {"Drive-by Compromise" : false},
                                "Drive-by Compromise" : {"Native API": false},
                                "Native API" : {"Modify Registry": false},
                                "Modify Registry" : {"Brute Force": false,"Browser Bookmark Discovery": false, "File and Directory Discovery": false, "Network Share Discovery": false, "Process Discovery": false, "System Information Discovery": false, "System Network Connections Discovery": false, "System Owner,User Discovery": false},
                                "Browser Bookmark Discovery" :  {"Clipboard Data": false},
                                "File and Directory Discovery":  {"Clipboard Data": false},
                                "Network Share Discovery":  {"Data from Local System": false},
                                "Process Discovery":  {"Data from Local System": false}, 
                                "System Information Discovery":  {"Data from Local System": false},
                                "System Network Connections Discovery":  {"Data from Local System": false},
                                "System Owner,User Discovery":  {"Data from Local System": false},
                                "Clipboard Data":  {"System Shutdown,Reboot": false },
                                "Data from Local System" :  {"Ingress Tool Transfer": false, "Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown,Reboot": false }
                            },

                            // scenario 5
                            {
                                "startAttack" : {"Drive-by Compromise" : false, "Exploit Public-Facing Application" : false},
                                "Drive-by Compromise": {"Windows Management Instrumentation": false},
                                "Exploit Public-Facing Application": {"Windows Management Instrumentation": false},
                                "Windows Management Instrumentation" :{"Scheduled Task,Job": false},
                                "Scheduled Task,Job" : {"Deobfuscate,Decode Files or Information": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate,Decode Files or Information" : {"Domain Trust Discovery": false, "System Network Configuration Discovery": false,  "System Owner,User Discovery" : false },
                                "Modify Registry" : {"Process Discovery": false},
                                "Obfuscated Files or Information"  : {"Remote System Discovery": false, "System Network Configuration Discovery": false, "System Network Connections Discovery": false, "System Owner,User Discovery": false, "System Service Discovery": false },
                                "Domain Trust Discovery" : {"Proxy": false},
                                "Process Discovery" : {"Proxy": false},
                                "Remote System Discovery" : {"Exploitation of Remote Services": false},
                                "System Network Configuration Discovery": {"Proxy": false},
                                "System Network Connections Discovery":{"Proxy": false},
                                "System Owner,User Discovery":{"Proxy": false},
                                "System Service Discovery": {"Proxy": false},
                            }
                        ]
                    }),
                ]
            });

            initCompanyArray.push(initCompany);
            console.log("[Init Game] initCompanyArray : ", initCompanyArray);
        }

        var RoomTotalJson  = {
            roomPin : room_key,
            server_start  : new Date(),
            server_end  :  new Date(),
            blackTeam  : new BlackTeam({ 
                total_pita : 500,
                users : blackUsers,
                scenarioLevel : [-1,-1,-1, -1, -1], 
            }),
            whiteTeam  : new WhiteTeam({ 
                total_pita : 500,
                users : whiteUsers
            }),
            companyA    : initCompanyArray[0],
            companyB    : initCompanyArray[1],
            companyC    : initCompanyArray[2],
            companyD    : initCompanyArray[3],
            companyE    : initCompanyArray[4],
        };
      
        return RoomTotalJson
    }

    
  }
  