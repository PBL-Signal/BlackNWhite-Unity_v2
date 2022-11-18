const url = require('url');
const async = require('async');

const { Socket } = require('dgram');
const { stringify } = require('querystring');
const config = require('./configure');

const REDIS_PORT = 6380;
const Redis = require("ioredis"); 
const redisClient = new Redis(REDIS_PORT);
const { RedisSessionStore } = require("./sessionStore");
const sessionStore = new RedisSessionStore(redisClient);

const { redisHashTableStore } = require("./redisHashTableStore");
const hashtableStore = new redisHashTableStore(redisClient);

const { RedisJsonStore } = require("./redisJsonStore");
const jsonStore = new RedisJsonStore(redisClient);

const { redisListStore } = require("./redisListStore");
const listStore = new redisListStore(redisClient);

const { RedisRoomStore, InMemoryRoomStore } = require("./roomStore");
const redis_room = new RedisRoomStore(redisClient);

const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const RoomTotalSchema = require("./schemas/roomTotal/RoomTotalSchema");
const BlackTeam = require("./schemas/roomTotal/BlackTeam");
const WhiteTeam = require("./schemas/roomTotal/WhiteTeam");
const BlackUsers = require("./schemas/roomTotal/BlackUsers");
const UserCompanyStatus = require("./schemas/roomTotal/UserCompanyStatus");
const WhiteUsers = require("./schemas/roomTotal/WhiteUsers");
const Company = require("./schemas/roomTotal/Company");
const Section = require("./schemas/roomTotal/Section");
const Progress = require("./schemas/roomTotal/Progress");

const RoomInfoTotal = require("./schemas/roomTotal/RoomInfoTotal");
const User = require("./schemas/roomTotal/User");
const RoomInfo = require("./schemas/roomTotal/RoomInfo");

// MongoDB관련
const func = require('./server_functions/db_func');
const {lobbyLogger, gameLogger, chattingLogger} = require('./logConfig'); 

const os = require( 'os' );
const { emit } = require('process');
var networkInterfaces = os.networkInterfaces( );
var server_ip = networkInterfaces['Wi-Fi'][1].address;

// 자바스크립트는 특정 문자열 인덱스 수정 불가라, 이를 대체하기 위해 가져온 함수
String.prototype.replaceAt = function(index, replacement) {
    if (index >= this.length) {
        return this.valueOf();
    }

    return this.substring(0, index) + replacement + this.substring(index + 1);
}

module.exports = (io) => {
    
    var gameserver = io.of("blacknwhite");
 
    var rooms ={};  // 여러 방 정보를 저장하는 딕셔너리
    var userPlacement ={}; // # WaitingRoom TeamChange 및 UI 배치 관련 정보 저장
    let Players = [];
    let gamePlayer = {};
    let evenNumPlayer = false;
    let numPlayer = 1;
    let companyNameList = ["companyA", "companyB", "companyC", "companyD", "companyE"];
    let taticNamesList = ["Reconnaissance", "Resource Development", "Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Collection", "Command and Control", "Exfiltration", "Impact"];
    let areaNameList = ["DMZ", "Internal", "Security"]

    let timerId;
    let pitaTimerId;

    /*
    // !! 로그 저장 예시 !!
    lobbyLogger.error('mainHome:login', {
        server : 'server1',
        userIP : '192.0.0.1',
        sessionID : 'b8dscb35vjm2ki81d5x',
        userID : 'ucsseqerb14ned321b',
        nickname : "hyeMin",
        data : {status : 1} 
    });

    gameLogger.info("mainHome:create room", {
        server : 'server1',
        userIP : '192.0.0.1',
        sessionID : 'b8dscb35vjm2ki81d5x',
        userID : 'ucsseqerb14ned321b',
        nickname : "hyeMin",
        data : 	{
            roomID : "sdfsdfb124gvv",
            room : "23012", 
            roomType : "public", 
            maxPlayer : 5,
            status : 1,
      },
    });
    */
    
    
    io.use(async (socket, next) => {
        // console.log("io.use");
        const sessionID = socket.handshake.auth.sessionID;
        // 가장 먼저 CONNECTION들어가기 전에 SESSIONID 있는지 확인
        //finding existing session
        const session = await sessionStore.findSession(sessionID);

        if(sessionID){
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.nickname = session.username;
            console.log("io.use 세션 있음", session.userID, sessionID);
            return next();
        }
        // 처음 연결되는 경우 즉, SESSIONID 없으면 
        const username = socket.handshake.auth.username;

        if (!username) {
            return next(new Error("invalid username")); // 새로운 세션 계속 안생기게 해주는 것
            // USERNAME 입력시에만 세션이 만들어짐 
        }
        // console.log("io.use 세션 새로 생성", username);
        //create new session
        socket.sessionID = randomId();
        socket.userID = randomId();
        socket.nickname = username;


        // console.log("session 설정 확인 - sessionID", socket.sessionID);
        // console.log("session 설정 확인 - userID", socket.userID);
        // console.log("session 설정 확인 - username", socket.username);
        next();
    });


    io.on('connection', async(socket) => {
        // console.log("io-handler.js socket connect!!");
        // console.log("socketid : "+ socket.id); 
     
        // console.log("sessionID : "+ socket.sessionID); 
        // console.log("userID : "+ socket.userID); 
 
        // console.log("session 설정 확인 - sessionID", socket.sessionID);
        // console.log("session 설정 확인 - userID", socket.userID);
        // console.log("session 설정 확인 - username", socket.nickname);

        
    
        try{
            await sessionStore.saveSession(socket.sessionID, {
                userID: socket.userID,
                username: socket.nickname,
                connected: true,
            }).catch( 
            function (error) {
            console.log('catch handler', error);
            });
            // console.log("connect: saveSession");
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
     

         // [MainHome] 사용자 정보(session) 확인 
        socket.on('checkSession', () => {
            var session = { 
                sessionID: socket.sessionID,
                userID: socket.userID,
                nickname: socket.nickname,  // 원래는 username임
            };
    
            var sessionJSON= JSON.stringify(session);
            socket.emit("sessionInfo", sessionJSON);
        });




        // [MainHome] pin 번호 입력받아 현재 활성화된 방인지 검증함
        // [MainHome] 오픈 방 클릭시 
        socket.on("isValidRoom", async(room) => {
            console.log('[socket-isValidRoom] room:',room);
        
            // var room_data = { 
            //     permission: await UpdatePermission(room)
            // };
            var permission = await UpdatePermission(room);
            console.log('[socket-isValidRoom] permission: ', permission);
            
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
            var roomPin, roomID; 
            /*
             - 경우 1 : 공개방 O -> public이고 isnotfull인 방 키 return 
             - 경우 2 : 공개방 X -> 새 공개방 만들고 입장하기 
            */

            // step 0. redis-publicWaitingRoom 상태 확인 

            var publicRoomCnt = await listStore.lenList('publicRoom', 'roomManage');
            console.log("publicRoomCnt : ", publicRoomCnt);


            if(publicRoomCnt > 0){    
                // 경우 1
                var publicRoomList = await listStore.rangeList('publicRoom', 0, -1, 'roomManage');
                console.log("! publicRoomList : ", publicRoomList);

                //0~9까지의 난수
                var randomNum = {};
                randomNum.random = function(n1, n2) {
                    return parseInt(Math.random() * (n2 -n1 +1)) + n1;
                };

                var randomRoomIdx = randomNum.random(0,publicRoomCnt-1);
                var roomPin = publicRoomList[randomRoomIdx];
                console.log("@ randomRoomIdx  : ", randomRoomIdx);
                console.log("@ roomPin  : ", roomPin);
                
                socket.room = roomPin;
                socket.roomID  = JSON.parse(await redis_room.getRoomInfo(roomPin)).roomID;
                console.log("socket.room", socket.room, " socket.roomID ", socket.roomID );
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
                // 경우 2
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

                console.log("succesCreateRoom roomPin: " , room_info.roomPin);
            }    
            socket.room = room_info.roomPin;
            socket.roomID = room_info.roomID;
          
            console.log("socket.room", socket.room, "socket.roomID ", socket.roomID );
            socket.emit('enterPublicRoom');

        });


        // [MainHome] 룸 리스트 정보 반환 
        socket.on("getPublcRooms", async() => {
            console.log('[getPublcRooms]');
            // <<코드 미정>> 코드 수정 필요
            // 방 pin 번호, 방 인원수 
            // var roomslist = await redis_room.viewRoomList();
            var roomslist = await listStore.rangeList('publicRoom', 0, -1, 'roomManage');
            console.log('[getPublcRooms] roomsList : ', roomslist);
            var publicRooms = []
            for (const room of roomslist){
                // publicRooms[room] = await redis_room.RoomMembers_num(room)
                publicRooms.push({
                    'roomPin' : room.toString(),
                    'userCnt' : (await redis_room.RoomMembers_num(room)).toString(),
                    'maxPlayer' : JSON.parse(await redis_room.getRoomInfo(room)).maxPlayer
                });               
            }   
        
            console.log(">>> publicRooms : ", publicRooms);
            socket.emit('loadPublicRooms', publicRooms);
        });

        // [CreateRoom] 새 방을 만듦
        socket.on("createRoom", async(room) =>{
            console.log('[socket-createRoom] 호출됨, 받은 room 정보 (maxPlayer): ', room);
            console.log('[socket-createRoom] room.roomType', room.roomType);
            // hashtableStore.storeHashTable("key", {"a":"f", 1:2}, 1, 2);
               
            var room_info= await createRoom(room.roomType, room.maxPlayer);
            // await initRoom(roomPin);

            console.log("succesCreateRoom roomPin: " , room_info.roomPin);
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

            io.sockets.emit('Visible AddedSettings'); // actionbar
            console.log('[add user] add user 호출됨 user : ', socket.nickname, 'room : ', socket.room );
            /*
                < 로직 > 
                1. redis에서 room 정보 불러오기
                2. new user를 white/black 배정 및 profile 색 지정 
                3. 2번에서 만든 new user정보 저장(redis_room.addMember) 및 socket.join 
                4. 사용자 로그인 알림 (new user에게 모든 사용자의 정보를 push함) 
                5. new user외의 사용자들에게 new user정보보냄
            */
        

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
            const rand_Color = roomManageDict.profileColors.indexOf('0'); //0~11
            roomManageDict.profileColors = roomManageDict.profileColors.replaceAt(rand_Color, '1');
            console.log("rand_Color : ",rand_Color ,"roomManageDict.profileColors : " , roomManageDict.profileColors);
            // const rand_Color = Math.floor(Math.random() * 12);
            await hashtableStore.storeHashTable(room, roomManageDict, 'roomManage'); // 무조건 PlaceUser 위에 있어야 함!
            
            let playerInfo = { userID: socket.userID, nickname: socket.nickname, team: team, status: 0, color: rand_Color, place : await PlaceUser(room, team), socketID : socket.id };
            console.log("PlayersInfo : ", playerInfo);

            
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

            console.log('!!!~~RoomMembersDict', RoomMembersDict);

            var room_data = { 
                room : room,
                clientUserID : socket.userID,
                maxPlayer : roomManageDict.maxPlayer,
                users : RoomMembersDict
            };
            var roomJson = JSON.stringify(room_data);

            console.log('check roomJson : ', roomJson);
            // io.sockets.in(room).emit('login',roomJson); 
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
            console.log('changeReadyStatus status : ', newStatus);
            
            // 1. 사용자 정보 수정 
            var playerInfo = await redis_room.getMember(socket.room, socket.userID);
            console.log("!PlayersInfo : ", playerInfo);
            playerInfo.status = newStatus;

            await redis_room.updateMember(socket.room, socket.userID, playerInfo);

            // 2. ready한 경우 room_info 바꿔주기 
            var roomInfo  = await hashtableStore.getHashTableFieldValue(socket.room, ['readyUserCnt', 'maxPlayer'], 'roomManage');
            var readyUserCnt = parseInt(roomInfo[0]);
            var maxPlayer =  parseInt(roomInfo[1]);
            console.log("!readyUserCnt : ", readyUserCnt);
            console.log("!maxPlayer : ", maxPlayer);

            if (newStatus == 1){
                readyUserCnt += 1
            }else {
                readyUserCnt -= 1
            }

            console.log("!readyUserCnt : ", readyUserCnt);
            await hashtableStore.updateHashTableField(socket.room, 'readyUserCnt', readyUserCnt, 'roomManage'); 
           


            // 47 수정한 내용 client들에게 뿌리기
            var playerJson = JSON.stringify(playerInfo);

            console.log('check playerJson : ', playerJson);
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
                console.log("!모두 레디함!");
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

           }else{
              
           }

          

        });


        // [WaitingRoom] profile 변경 시 
        socket.on('changeProfileColor',  async() =>{
            console.log('changeProfileColor 프로필 변경');
            
            // 0. 이전의 사용자 정보의 프로필 색상 인덱스 가져옴
            var playerInfo = await redis_room.getMember(socket.room, socket.userID);
            var prevColorIndex = playerInfo.color;
            console.log("PlayersInfo : ", playerInfo);

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
            console.log("rand_Color : ",rand_Color ,"profileColors : " , profileColors);
            await hashtableStore.updateHashTableField(socket.room, 'profileColors', profileColors, 'roomManage');

            // 2. 사용자 정보 수정 
            playerInfo.color = rand_Color;
            console.log(" 수정 후 PlayersInfo : ", playerInfo);

            await redis_room.updateMember(socket.room, socket.userID, playerInfo);


            // 3. 수정한 내용을 요청한 사람 포함 모두에게 뿌리기
            var playerJson = JSON.stringify(playerInfo);

            console.log('check : ', playerJson);
            // socket.broadcast.to(socket.room).emit('updateUI', playerJson);
            io.sockets.in(socket.room).emit('updateUI',playerJson); // 모든 사람에게 뿌림


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
            console.log("_____________________________________________________________________");
            console.log('!!!!changeTeamStatus changeStatus : ', changeStatus);
            var room = socket.room;

            // 1. 사용자 정보 (status)수정  
            var playerInfo = await redis_room.getMember(room, socket.userID);
            playerInfo.status = changeStatus;
            console.log("PlayersInfo : ", playerInfo);

            await redis_room.updateMember(room, socket.userID, playerInfo);
            io.sockets.in(socket.room).emit('updateUI',JSON.stringify(playerInfo));


            var prevTeam = playerInfo.team; // 팀 바꾸기 전 현재 사용자 팀 정보
            var prevPlace = playerInfo.place;
            console.log("## prevTeam : ", prevTeam, "  prevPlace : ", prevPlace );

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
                    console.log("웨이팅 리스트에서 삭제함 : "+ myWaitingField + mywaitingList);
                    await hashtableStore.updateHashTableField(room, myWaitingField, mywaitingList.join(','), 'roomManage');
                }

                // 2-1. 수정한 내용 client들에게 뿌리기
                var playerJson = JSON.stringify(playerInfo);
                console.log('check : ', playerJson);
                socket.broadcast.to(socket.room).emit('updateUI', playerJson);

                lobbyLogger.info('waitingRoom:switch_team_off ', {
                    server : server_ip,
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userID,
                    nickname : socket.nickname,
                    data : 
                        {
                            // detail : "teamChange Off",
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
                /*
                경우 2가지 : 
                    - 경우 1 : 다른 팀의 자리가 있어서 바로 변경 가능
                    - 경우 2 : full 상태라 1:1로 팀 change를 해야되는 상황 
                ! 추가 처리 사항 !
                    - 입장 시 random시 evenNumPlayer 따른 팀 자동 선택 변수 제어해야 될 듯
                */

                // 0. redis에서 room 정보 불러오기s
                var roomManageDict = await hashtableStore.getAllHashTable(room, 'roomManage'); // 딕셔너리 형태
                console.log('!!!~~룸정보 roomManage', roomManageDict);


                // 경우 1 : 다른 팀의 자리가 있어서 바로 변경 가능
                console.log("@roomManageDict.blackUserCnt : ", roomManageDict.blackUserCnt);
                console.log("@roomManageDict.whiteUserCnt : ", roomManageDict.whiteUserCnt);
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
                    console.log("[찐최종 저장 ] playerInfo : ", playerInfo);
                    await redis_room.updateMember(room, socket.userID, playerInfo);


                    // 2. 바뀐 정보 클라쪽에 보내기
                    var changeInfo = { 
                        type : 1,
                        player1 : playerInfo, // 이전 ->수정 후 v3
                    };

                    var teamChangeInfo = JSON.stringify(changeInfo);
                    console.log('check : ', teamChangeInfo);
                    io.sockets.in(socket.room).emit('updateTeamChange',teamChangeInfo);

                    lobbyLogger.info('waitingRoom:switch_team_on1 ', {
                        server : server_ip,
                        userIP : '192.0.0.1',
                        sessionID : socket.sessionID,
                        userID : socket.userID,
                        nickname : socket.nickname,
                        data : 
                            {
                                // detail : "teamChange On1",
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
                    console.log("[case2]  ");

                    // 경우 2-1 : 상대팀에서 팀 변경 원하는 사람이 있는지 확인 
                    var othersWaitingField, myWaitingField;
                    if (prevTeam){ //현재 팀 바꾸길 원하는 사용자가 화이트->블랙이므로, toWhiteUsers가 있는지 확인하기 
                        othersWaitingField = 'toWhiteUsers';
                        myWaitingField = 'toBlackUsers';
                    }
                    else{ 
                        othersWaitingField = 'toBlackUsers';
                        myWaitingField = 'toWhiteUsers';
                    }

                    var othersWaitingData = await hashtableStore.getHashTableFieldValue(room, [othersWaitingField], 'roomManage');
                    var myWaitingData = await hashtableStore.getHashTableFieldValue(room, [myWaitingField], 'roomManage');
                    console.log("othersWaitingListData : " , othersWaitingData);
                    console.log("othersWaitingListData[0].length : " , othersWaitingData[0].length);
                    console.log("myWaitingListData : " , myWaitingData);
                    console.log("myWaitingListData[0].length : " , myWaitingData[0].length);

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
           
                    console.log("otherswaitingList : " , otherswaitingList);
                    console.log("mywaitingList : " , mywaitingList);
               
                    // 맞교환할 사람이 없으면 웨이팅리스트에 추가
                    if (otherswaitingList.length == 0){
                        console.log("맞교환 X - 웨이팅리스트에 추가");
                        mywaitingList.push(socket.userID);
                        // mywaitingList.push({ socketID : socket.id, userID : socket.userID});
                        console.log("check mywaitingList : " , mywaitingList);
                        await hashtableStore.updateHashTableField(room, myWaitingField, mywaitingList.join(','), 'roomManage');
                        
                        lobbyLogger.info('waitingRoom:switch_team_wait', {
                            server : server_ip,
                            userIP : '192.0.0.1',
                            sessionID : socket.sessionID,
                            userID : socket.userID,
                            nickname : socket.nickname,
                            data : 
                                {
                                    // detail : "teamChange Wait",
                                    roomID : socket.roomID,
                                    room : socket.room,
                                    team: playerInfo.team,
                                    color:playerInfo.color,
                                    place : playerInfo.place,
                                    status: playerInfo.status
                            },
                        });
                    
                    }else{
                        // 맞교환 진행
                        console.log("맞교환 O");
                                 
                        var mateUserID = otherswaitingList.shift();
                        console.log("mateUserID : ", mateUserID);
                        await hashtableStore.updateHashTableField(room, othersWaitingField, otherswaitingList.join(','), 'roomManage');
                        
                        var matePlayerInfo = await redis_room.getMember(room, mateUserID);
                        console.log("mate 정보 : " , matePlayerInfo);
                        console.log("나 정보 : " , playerInfo);
                        
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
                        console.log('check : ', teamChangeInfo);
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
                                    // detail : "teamChange On2",
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
            console.log("updateSocketTeam : " ,socket.team);

            var playerInfo = await redis_room.getMember(socket.room, socket.userID);
            lobbyLogger.info('waitingRoom:switch_team_on2_2 ', {
                server : server_ip,
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userID,
                nickname : socket.nickname,
                data : 
                    {
                        // detail : "teamChange On2",
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
            console.log(">>>>> [leaveRoom]!");

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
            console.log("blackUsersInfo 배열 : ", blackUsersInfo);
            console.log("whiteUsersInfo 배열 : ", whiteUsersInfo);
               
            // 게임 관련 Json 생성 (new)
            var roomTotalJson = InitGame(socket.room, blackUsersInfo, whiteUsersInfo);

            
            // monitoringLog 생성
            var monitoringLog = [];
            jsonStore.storejson(monitoringLog, socket.room+":blackLog");
            jsonStore.storejson(monitoringLog, socket.room+":whiteLog");
       
            // redis에 저징
            jsonStore.storejson(roomTotalJson, socket.room);

            // socket.broadcast.to(socket.room).emit('onGameStart');  //ver0
            io.sockets.in(socket.room).emit('onGameStart'); // ver1/

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
            // console.log("@@ socket.nickname : " , socket.nickname, " socket.roomTeam  : ",  socket.roomTeam);
            socket.join(socket.roomTeam);

            socket.emit('loadMainGame', socket.team.toString()); //ver3
            // io.sockets.in(socket.room+'false').emit('onBlackGameStart');// ver2
            // io.sockets.in(socket.room+'true').emit('onWhiteGameStart');// ver2
        
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


        // [MainGame] 게임 시작시 해당 룸의 사용자 정보 넘김
        socket.on('InitGame',  async() =>{
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("On Main Map roomTotalJson : ", roomTotalJson);

            let abandonStatusList = [];
            for(let company of companyNameList){
                abandonStatusList.push(roomTotalJson[0][company]["abandonStatus"]);
            }

            var pitaNum;
            let teamProfileJson = {}
            let userId = []
            if (socket.team == true){
                pitaNum = roomTotalJson[0]["whiteTeam"]["total_pita"];
                for (const userID in roomTotalJson[0]["whiteTeam"]["users"]){
                    teamProfileJson[userID] = roomTotalJson[0]["whiteTeam"]["users"][userID]["profileColor"];
                    userId.push(userID);
                }

            } else {
                pitaNum = roomTotalJson[0]["blackTeam"]["total_pita"];
                for (const userID in roomTotalJson[0]["blackTeam"]["users"]){
                    teamProfileJson[userID] = roomTotalJson[0]["blackTeam"]["users"][userID]["profileColor"];
                    userId.push(userID);
                }
            }

            console.log("teamprofileColor 정보 :", teamProfileJson);

            var room_data = { 
                teamName : socket.team,
                teamProfileColor : teamProfileJson,
                userID : userId,
                teamNum : userId.length
            };
            var roomJson = JSON.stringify(room_data);


            console.log("Team 정보 :", socket.team);
            console.log("room 정보 :", socket.room);
            console.log("roomJson!! :",roomJson);
            // io.sockets.in(socket.room).emit('MainGameStart', roomJson);
            socket.emit('MainGameStart', roomJson);
            socket.emit('Load Pita Num', pitaNum);
            
            console.log("On Main Map abandonStatusList : ", abandonStatusList);
            io.sockets.in(socket.room).emit('Company Status', abandonStatusList);

            // io.sockets.emit('Visible LimitedTime', socket.team.toString()); // actionbar
            console.log("[[[InitGame]] socket.nickname, team : ", socket.nickname, socket.team);
            socket.emit('Visible LimitedTime', socket.team.toString()); // actionbar

            // Timer 시작(게임전체시간)
            var time = 600; //600=10분, 1분 -> 60
            var min = "";
            var sec = "";

            // 게임 시간 타이머 
            io.sockets.in(socket.room).emit('Timer START');
            timerId = setInterval(async function(){
                min = parseInt(time/60);
                sec = time%60;
                // console.log("TIME : " + min + "분 " + sec + "초");
                time--;
                if(time<=0) {
                    console.log("시간종료!");
                    io.sockets.in(socket.room).emit('Timer END');
                    clearInterval(timerId);
                    clearInterval(pitaTimerId);

                    // 게임종료 -> 점수 계산 함수 호출
                    let roomTotalJsonFinal = JSON.parse(await jsonStore.getjson(socket.room));
                    io.sockets.in(socket.room).emit('Load_ResultPage');
                    socket.on('Finish_Load_ResultPage', ()=> { TimeOverGameOver(socket, roomTotalJsonFinal); });               
                    
                }
            }, 1000);

            // pita 10초 간격으로 pita 지급
            var pitaInterval= config.BLACK_INCOME.time * 1000; // black, white 동일함 * 1000초
            // console.log("[TEST] pitaInterval :", pitaInterval);
            pitaTimerId = setInterval(async function(){
                const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

                roomTotalJson[0].blackTeam.total_pita += config.BLACK_INCOME.pita;
                roomTotalJson[0].whiteTeam.total_pita += config.WHITE_INCOME.pita;

                var black_total_pita = roomTotalJson[0].blackTeam.total_pita;
                var white_total_pita = roomTotalJson[0].whiteTeam.total_pita;

                await jsonStore.updatejson(roomTotalJson[0], socket.room);

                console.log("!!! [월급 지급] black_total_pita : " + black_total_pita + " white_total_pita : " + white_total_pita);
                
                io.sockets.in(socket.room+'false').emit('Update Pita', black_total_pita);
                io.sockets.in(socket.room+'true').emit('Update Pita', white_total_pita);
                // io.sockets.in(socket.room).emit("Load Pita Num", black_total_pita);
    
            }, pitaInterval);


        });
        
        // [블랙팀] 시나리오의 힌트북 레벨 정보 emit
        socket.on('GetScenarioLv',  async function() {
            console.log("[On] GetScenarioLv");

            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);
            socket.emit('BroadScenarioLv', scenarioLvList);
        });


         // [블랙팀] 시나리오의 힌트북 레벨업 
         socket.on('TryUpgradeScenario',  async function(selectedScenario) {
            console.log("[On] Upgrade Scenario: " + selectedScenario);
          
            //  json 불러와서 블랙피타정보, 시나리오 레벨 정보 가져옴
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var black_total_pita = roomTotalJson[0].blackTeam.total_pita;
            console.log("blackTeam.total_pita!!!", black_total_pita );

            var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);
            // var scenarioNum = roomTotalJson[0][data.company]["sections"][data.section].selectScenario;
            var scenarioLv = scenarioLvList[selectedScenario];

            // 레벨업 가능한지 확인
            if (scenarioLv >= 5){
                socket.emit('ResultUpgradeScenario', false);
                return;
            }

            // 가격 확인
            if (parseInt(black_total_pita) - parseInt(config.UPGRADE_SCENARIO.pita[scenarioLv]) < 0){
                console.log("업그레이드 실패 ! - pita 부족");
                socket.emit('ResultUpgradeScenario', false);
                return;
            };

            // lv 업그레이드 및 pita 가격 마이너스 
            scenarioLvList[selectedScenario] += 1
            roomTotalJson[0]["blackTeam"]["scenarioLevel"] = scenarioLvList;
            roomTotalJson[0].blackTeam.total_pita = parseInt(roomTotalJson[0].blackTeam.total_pita) - parseInt(config.UPGRADE_SCENARIO.pita[scenarioLv]);
            await jsonStore.updatejson(roomTotalJson[0], socket.room);

            io.sockets.in(socket.room+'false').emit('Update Pita', roomTotalJson[0].blackTeam.total_pita );
            socket.emit('ResultUpgradeScenario', true);
            io.sockets.in(socket.room).emit('BroadScenarioLv', scenarioLvList);
            console.log("업그레이드 성공 ! " + scenarioLvList);
        });

         // [블랙팀] 시나리오의 힌트북 구입
         socket.on('TryBuyScenario',  async function(selectedScenario) {
            console.log("[On] Buy Scenario: " + selectedScenario);
          
            //  json 불러와서 블랙피타정보, 시나리오 레벨 정보 가져옴
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var black_total_pita = roomTotalJson[0].blackTeam.total_pita;
            console.log("blackTeam.total_pita!!!", black_total_pita );

            var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);
            var scenarioLv = scenarioLvList[selectedScenario];

            // 레벨업 가능한지 확인
            if (scenarioLv != -1){
                socket.emit('ResultBuyScenario', false);
                return;
            }

            // 가격 확인
            if (parseInt(black_total_pita) - parseInt(config.BUY_SCENARIO.pita[selectedScenario]) < 0){
                console.log("구입 ! - pita 부족");
                socket.emit('ResultBuyScenario', false);
                return;
            };

            // lv 업그레이드 및 pita 가격 마이너스 
            scenarioLvList[selectedScenario] += 1
            roomTotalJson[0]["blackTeam"]["scenarioLevel"] = scenarioLvList;
            roomTotalJson[0].blackTeam.total_pita = parseInt(roomTotalJson[0].blackTeam.total_pita) - parseInt(config.UPGRADE_SCENARIO.pita[scenarioLv]);
            await jsonStore.updatejson(roomTotalJson[0], socket.room);

            io.sockets.in(socket.room+'false').emit('Update Pita', roomTotalJson[0].blackTeam.total_pita );
            socket.emit('ResultBuyScenario', true);
            io.sockets.in(socket.room).emit('BroadScenarioLv', scenarioLvList);
            console.log("구입 성공 ! " + scenarioLvList);
        });


        // [블랙팀] 해당 섹션의 선택된 시나리오의 힌트북 가져옴 
        socket.on('GetSectAttScenario',  async function(data) {
            console.log("[On] GetSectAttScenario ", data.section, data.company, data.scenario);

            var scenarioLv = 0;
            var scenarioNum = data.scenario + 1;
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            
            
            // 회사의 시나리오 레벨 &선택한 시나리오 가져옴
            var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);

            if (data.scenario != -1){
                // 시나리오 레벨에 따라 선택한 시나리오 정보 가져옴
                scenarioLv = scenarioLvList[data.scenario];
                console.log("!-- scenarioLv : ", scenarioLvList[data.scenario]);

                var sectScenarioHint = { // 보낼 힌트 스키마
                    selectScenario : data.scenario,
                    scenarioLv : scenarioLv
                };

                var attackHint = []; 
                var progressAtt = [];

                // 단계 1. 현재 진행 중인 공격 뽑기 (attackSenarioProgress스키마)
                var sectionAttProgSenario = roomTotalJson[0][data.company].sections[data.section].attackSenarioProgress[data.scenario];
                console.log("sectionAttProgSenario :", sectionAttProgSenario);
                sectionAttProgSenario.forEach((value, index, array) => {
                    console.log(`${index} :  ${value.attackName}`); 
                    if(value.state==2){
                        var attIdx = config.ATTACK_CATEGORY_DICT[value.tactic];
                    //    progressAtt[attIdx] = [value.attackName]; // 중복 들어가면 어쩌지
                        progressAtt.push    ({'attIdx' : attIdx, 'attack' : value.attackName});
                    }
                });

                sectScenarioHint['progressAtt'] = progressAtt;
                console.log(`sectScenarioHint : ` + progressAtt); 

                // 단계 2. 레벨별 힌트 저장 
                if (scenarioLv == 1){ // 완료
                    // lv1: 각 단계 공격 여부
                    for(let i = 0; i <= 13; i++){
                        if(Object.values(config["SCENARIO" +scenarioNum].attacks[i]).length == 0){
                            attackHint[i] =  false;
                        }else{
                            attackHint[i] =  true;
                        }
                    }
                    sectScenarioHint['isAttacks'] = attackHint;
                }

                if(scenarioLv >= 2){ // lv :2~5 적용 // 완료
                    // lv2: 각 단계 공격 개수
                    for(let i = 0; i <= 13; i++){
                        attackHint[i] =  Object.values(config["SCENARIO" +scenarioNum].attacks[i]).length;
                    }

                    sectScenarioHint['attacksCnt'] = attackHint;
                }

                // 다음 공격 해주는건 GetConnectedAtt 함수에서 해주는 것으로 변경
                // if(scenarioLv >= 3){
                //     // lv3: 현재 완료된 공격 다음에 갈 수 있는 다음 화살표
                //     var progAttackConn = {};
                //     // 현재 완료된 공격 불러와서 연결된 공격 저장 
                //     for (const attack of progressAtt){
                //         // progAttackConn[attack.attack] = 
                //         // {
                //         //     'category' : config.ATTACK_CATEGORY_DICT[attack.attIdx],
                //         //     'attack' :   config.SCENARIO1.attackConn[attack.attack]
                //         // }
                //         progAttackConn[attack.attack] = config["SCENARIO" +scenarioNum].attackConn[attack.attack];
                    
                 
                //     }

                //     sectScenarioHint['progAttackConn'] = progAttackConn;
                // }

                if(scenarioLv >= 4){ 
                    // lv4: 모든 공격, 화살표 공개
                    // hintTotal = config.SCENARIO1;
                    sectScenarioHint['attacks']=  config["SCENARIO" +scenarioNum].attacks;
                    sectScenarioHint['attackConn'] = config["SCENARIO" +scenarioNum].attackConn;
                }

                if(scenarioLv >= 5){ // 완료
                    // lv5: 메인공격 공개
                    // 메인 공격 
                    sectScenarioHint['mainAttack'] = config["SCENARIO" +scenarioNum].mainAttack;
                }
            }

            // 힌트 보내기
            let sectScenarioHintJson = JSON.stringify(sectScenarioHint);
            console.log('sectionScenarioJson', sectScenarioHintJson);

            socket.emit('SendSectAttScenario', sectScenarioHintJson);
        });
      

        // [블랙팀] 선택한 공격에 연결된 다음 공격 정보 가져오기
        socket.on('GetConnectedAtt',  async function(data) {
            console.log("[On] OnGetConnectedAtt ", data.section, data.company, data.scenario, data.attack);

            var scenarioLv = 0;
            var scenarioNum = data.scenario + 1;
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            
            
            // 회사의 시나리오 레벨 &선택한 시나리오 가져옴
            var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);

            // 시나리오 레벨에 따라 선택한 시나리오 정보 가져옴
            scenarioLv = scenarioLvList[data.scenario];
            console.log("!-- scenarioLv : ", scenarioLvList[data.scenario]);

            // check1. 레벨 3이상인지 확인
            if(scenarioLv <= 2) return; 

            // check2. 레벨 3이면 진행된 공격인지 확인 (attackConn 연결이 true이면 됨)
            if(scenarioLv == 3){
                var isAttacked = false;
                
                var sectionAttProgSenario = Object.values(roomTotalJson[0][data.company].sections[data.section].attackConn[0]);
                console.log("sectionAttProgSenario :", sectionAttProgSenario);

                var attackParents = [];
                attackParents = config["SCENARIO" +scenarioNum].attackConnParent[data.attack];

                console.log("attackParents :", attackParents);

                for (const attParent in attackParents) {
                    console.log("세부 t/f 1 : " , sectionAttProgSenario[attParent]);
                    console.log("세부 t/f 2 : " , sectionAttProgSenario[attParent][data.attack]);
                    if (sectionAttProgSenario[attParent][data.attack] == true){
                        isAttacked = true;
                        break;
                    }
                    
                }

                if (isAttacked == false){
                    return;
                }
            } 


            // 공격 정보 뿌려주기
            var connectedAttHint = {};
            connectedAttHint['attack'] = data.attack;
            connectedAttHint['connection'] = config["SCENARIO" +scenarioNum].attackConnDetail[data.attack];
            let connectedAttJson = JSON.stringify(connectedAttHint);
            console.log("!-- connectedAttJson : ", connectedAttJson);
            socket.emit('SendConnectedAtt', connectedAttJson);
        });


         // [화이트팀] 해당 선택한 시나리오의 힌트북 가져옴 
         socket.on('GetScenario',  async function(data) {
            console.log("[On] GetScenario ", data.scenario);

            var scenarioLv = 0;
            var scenarioNum = data.scenario + 1;
        
            // 보낼 힌트 스키마
            var scenarioHint = { 
                selectScenario : data.scenario,
            };

            var attackHint = []; 
            var progressAtt = [];

            // lv2: 각 단계 공격 개수
            for(let i = 0; i <= 13; i++){
                attackHint[i] =  Object.values(config["SCENARIO" +scenarioNum].attacks[i]).length;
            }
            scenarioHint['attacksCnt'] = attackHint;
    
            // lv4: 모든 공격, 화살표 공개
            scenarioHint['attacks']=  config["SCENARIO" +scenarioNum].attacks;
            scenarioHint['attackConn'] = config["SCENARIO" +scenarioNum].attackConn;
    
            // lv5: 메인공격 공개
            scenarioHint['mainAttack'] = config["SCENARIO" +scenarioNum].mainAttack;
               
            // 힌트 보내기
            let scenarioHintJson = JSON.stringify(scenarioHint);
            console.log('scenarioHintJson', scenarioHintJson);

            socket.emit('SendScenario', scenarioHintJson);
        });

         // [화이트팀] 선택한 공격에 연결된 다음 공격 정보 가져오기
         socket.on('GetConnectedAttAll',  async function(data) {
            console.log("[On] GetConnectedAttAll ", data.scenario, data.attack);

            var scenarioNum = data.scenario + 1;

            // 공격 정보 뿌려주기
            var connectedAttHint = {};
            connectedAttHint['attack'] = data.attack;
            connectedAttHint['connection'] = config["SCENARIO" +scenarioNum].attackConnDetail[data.attack];
            let connectedAttJson = JSON.stringify(connectedAttHint);
            console.log("!-- connectedAttJson : ", connectedAttJson);
            socket.emit('SendConnectedAttAll', connectedAttJson);
        });

    
        ////////////////////////////////////////////////////////////////////////////////////
        // 회사 선택 후 사용자들에게 위치 알리기
        socket.on("Select Company", async(CompanyName) => {
            
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("Select Company CompanyIndex : ", CompanyName);

            let teamLocations = {};
            let teamLocationsJson = "";

            if (socket.team == true) {
                roomTotalJson[0]["whiteTeam"]["users"][socket.userID]["currentLocation"] = CompanyName;
                for (const userID in roomTotalJson[0]["whiteTeam"]["users"]){
                    teamLocations[userID] = roomTotalJson[0]["whiteTeam"]["users"][userID]["currentLocation"];
                }
                
                teamLocationsJson = JSON.stringify(teamLocations);
                console.log("teamLocationsJson : ", teamLocationsJson);
                socket.to(socket.room+'true').emit("Load User Location", teamLocationsJson);
            } else {
                roomTotalJson[0]["blackTeam"]["users"][socket.userID]["currentLocation"] = CompanyName;
                for (const userID in roomTotalJson[0]["blackTeam"]["users"]){
                    teamLocations[userID] = roomTotalJson[0]["blackTeam"]["users"][userID]["currentLocation"];
                }

                teamLocationsJson = JSON.stringify(teamLocations);
                console.log("teamLocationsJson : ", teamLocationsJson);
                socket.to(socket.room+'false').emit("Load User Location", teamLocationsJson);
            }

            socket.emit("Load User Location", teamLocationsJson);

            await jsonStore.updatejson(roomTotalJson[0], socket.room);
        });


        socket.on("Back to MainMap", async() => {
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            let teamLocations = {};
            let teamLocationsJson = "";

            if (socket.team == true) {
                roomTotalJson[0]["whiteTeam"]["users"][socket.userID]["currentLocation"] = "";
                for (const userID in roomTotalJson[0]["whiteTeam"]["users"]){
                    teamLocations[userID] = roomTotalJson[0]["whiteTeam"]["users"][userID]["currentLocation"];
                }

                teamLocationsJson = JSON.stringify(teamLocations);
                console.log("teamLocationsJson : ", teamLocationsJson);
                socket.to(socket.room+'true').emit("Load User Location", teamLocationsJson);
            } else {
                roomTotalJson[0]["blackTeam"]["users"][socket.userID]["currentLocation"] = "";
                for (const userID in roomTotalJson[0]["blackTeam"]["users"]){
                    teamLocations[userID] = roomTotalJson[0]["blackTeam"]["users"][userID]["currentLocation"];
                }

                teamLocationsJson = JSON.stringify(teamLocations);
                console.log("teamLocationsJson : ", teamLocationsJson);
                socket.to(socket.room+'false').emit("Load User Location", teamLocationsJson);
            }
            
            socket.emit("Load User Location", teamLocationsJson);

            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        });

        socket.on("Section Activation Check", async(companyName) => {
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            
            var activationList = [];

            if (socket.team == true){
                for (let i = 0; i <roomTotalJson[0][companyName]["sections"].length; i++){
                    console.log("[socketon - Section Activation Check] roomTotalJson[0][companyName]['sections'][i] : ", roomTotalJson[0][companyName]["sections"][i]);
                    console.log("[socketon - Section Activation Check] roomTotalJson[0][companyName]['sections'][i]['activation'] : ", roomTotalJson[0][companyName]["sections"][i]["defensible"]);
                    activationList.push(roomTotalJson[0][companyName]["sections"][i]["defensible"]);
                }

            } else {
                for (let i = 0; i <roomTotalJson[0][companyName]["sections"].length; i++){
                    console.log("[socketon - Section Activation Check] roomTotalJson[0][companyName]['sections'][i] : ", roomTotalJson[0][companyName]["sections"][i]);
                    console.log("[socketon - Section Activation Check] roomTotalJson[0][companyName]['sections'][i]['activation'] : ", roomTotalJson[0][companyName]["sections"][i]["attackable"]);
                    activationList.push(roomTotalJson[0][companyName]["sections"][i]["attackable"]);
                }
            }         
    
            console.log("[Section Activation List] activationList : ", activationList);
    
            socket.emit("Section Activation List", companyName, activationList);

        });

        // Load Matrix Tactic
        socket.on('Load Tactic level', async(companyName, section) => {
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("load tactic level - companyName : ", companyName);
            console.log("load tactic level - section : ", section);

            let returnValue;
            if (socket.team == true) {
                returnValue = roomTotalJson[0][companyName]["penetrationTestingLV"];
                var attackable = roomTotalJson[0][companyName].sections[section]["defensible"];
            } else {
                returnValue = roomTotalJson[0][companyName]["attackLV"];
                var attackable = roomTotalJson[0][companyName].sections[section]["attackable"];
            }

            console.log("attackable : ", attackable);

            console.log("laod tactic level return : ", returnValue);

            socket.to(socket.room + socket.team).emit("Get Tactic Level", companyName, attackable, returnValue);
            socket.emit("Get Tactic Level", companyName, attackable, returnValue);
        });

        // Load Matrix Technique
        socket.on('Load Technique', async(companyName, section) => {
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("load technique : ", companyName);
            console.log("team : ", socket.team);

            if (socket.team == true) {
                let techniqueActivation = roomTotalJson[0][companyName]["sections"][section]["defenseActive"];
                let techniqueLevel = roomTotalJson[0][companyName]["sections"][section]["defenseLv"];

                console.log("techniqueActivation : ", techniqueActivation);
                console.log("techniqueLevel : ", techniqueLevel);

                socket.emit("Get Technique", companyName, techniqueActivation, techniqueLevel);
            }
        });


        // Matrix -> Emit Select Technique Num for Tactic Upgrade
        socket.on('Upgrade Tactic', async(companyName, section, attackIndex) => {
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("companyName : ", companyName, ",  attackIndex : ", attackIndex)
            console.log("attackIndex : ", attackIndex);

            let cardLv;
            let pitaNum = 0;
            if (socket.team == true) {
                console.log("white team upgrade attack card");
                cardLv = roomTotalJson[0][companyName]["penetrationTestingLV"][attackIndex];
                if (cardLv < 5) {
                    pitaNum = roomTotalJson[0]['whiteTeam']['total_pita'] - config["DEFENSE_" + (attackIndex + 1)]['pita'][cardLv];
                    roomTotalJson[0]['whiteTeam']['total_pita'] = pitaNum;

                    console.log("[!!!!!] pita num : ", pitaNum);
                }
            } else {
                console.log("black team upgrade attack card");
                cardLv = roomTotalJson[0][companyName]["attackLV"][attackIndex];
                console.log("team total_pita : ", roomTotalJson[0]['blackTeam']['total_pita'], ", config pita : ", config["ATTACK_" + (attackIndex + 1)]['pita'][cardLv]);
                if (cardLv < 5) {
                    pitaNum = roomTotalJson[0]['blackTeam']['total_pita'] - config["ATTACK_" + (attackIndex + 1)]['pita'][cardLv];
                    roomTotalJson[0]['blackTeam']['total_pita'] = pitaNum;
    
                    console.log("[!!!!!] pita num : ", pitaNum);
                }
            }

            if (pitaNum >= 0 && cardLv < 5) {
                socket.to(socket.room + socket.team).emit('Update Pita', pitaNum);
                socket.emit('Update Pita', pitaNum);

                let techniqueBeActivationList = roomTotalJson[0][companyName]["sections"][section]["beActivated"];
                techniqueBeActivationList.length = 0;

                // white team -> 공격을 선택할 수 있도록 함
                // balck team -> tactic 레벨 바로 업그레이드
                if (socket.team == true) {
                    console.log("Get Select Technique Num : ", config.ATTACK_UPGRADE_NUM[cardLv]);
                    socket.emit("Get Select Technique Num", companyName, attackIndex, config.ATTACK_UPGRADE_NUM[cardLv], 0);
                } else {
                    console.log("black team upgrade attack card");
                    roomTotalJson[0][companyName]["attackLV"][attackIndex] += 1;

                    console.log("black team tactic upgrade : ", roomTotalJson[0][companyName]["attackLV"]);

                    var attackable = roomTotalJson[0][companyName].sections[section]["attackable"];

                    socket.to(socket.room + socket.team).emit("Get Tactic Level", companyName, attackable, roomTotalJson[0][companyName]["attackLV"]);
                    socket.emit("Get Tactic Level", companyName, attackable, roomTotalJson[0][companyName]["attackLV"]);
                }

                await jsonStore.updatejson(roomTotalJson[0], socket.room);
                roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            } else {
                console.log("Something Problem!!!")
                console.log("pitanum : ", pitaNum)
                console.log("cardLv : ", cardLv)
                if (pitaNum < 0){
                    console.log("업그레이드 실패!! >> pita 부족");
                    socket.emit("Short of Money");
                } else if (cardLv >= 5){
                    console.log("업그레이드 실패!! >> 만랩 달성");
                    socket.emit("Already Max Level");
                }
            }
        });

        // Select Technique
        socket.on('Select Technique', async(companyName, section, categoryIndex, attackIndex) => {
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("Select Technique - companyName : ", companyName);
            console.log("Select Technique - section : ", section);
            console.log("Select Technique - categoryIndex : ", categoryIndex);
            console.log("Select Technique - attackIndex : ", attackIndex);

            let cardLv = roomTotalJson[0][companyName]["penetrationTestingLV"][categoryIndex];
            console.log("cardLV : ", cardLv);
            let techniqueBeActivationList = roomTotalJson[0][companyName]["sections"][section]["beActivated"];
            
            if (techniqueBeActivationList.includes(attackIndex)) {
                console.log("Already Select this Attack : ", attackIndex);
                for(var i = 0; i < techniqueBeActivationList.length; i++){ 
                    if (techniqueBeActivationList[i] === attackIndex) { 
                        techniqueBeActivationList.splice(i, 1); 
                        break;
                    }
                }
            } else {
                techniqueBeActivationList.push(attackIndex);
            }

            
            console.log("techniqueBeActivationList : ", techniqueBeActivationList);

            if (techniqueBeActivationList.length == config.ATTACK_UPGRADE_NUM[cardLv]) {
                // 선택 완료
                // let techniqueActivation = roomTotalJson[0][companyName]["sections"][section]["defenseActive"];
                // let techniqueLevel = roomTotalJson[0][companyName]["sections"][section]["defenseLv"];

                // for(var i = 0; i < techniqueBeActivationList.length; i++){ 
                //     techniqueActivation[categoryIndex][techniqueBeActivationList[i]] = 1;
                // }

                // console.log("techniqueActivation : ", techniqueActivation);
                // console.log("techniqueLevel : ", techniqueLevel);

                // socket.emit("Get Technique", companyName, techniqueActivation, techniqueLevel);

                socket.emit("Complete Select Technique", companyName, categoryIndex);

            } else {
                console.log("cardLv : ", cardLv);
                console.log("config.ATTACK_UPGRADE_NUM[cardLv] : ", config.ATTACK_UPGRADE_NUM[cardLv]);
                console.log("techniqueBeActivationList.length : ", techniqueBeActivationList.length);
                socket.emit("Get Select Technique Num", companyName, categoryIndex, config.ATTACK_UPGRADE_NUM[cardLv], techniqueBeActivationList.length);
            }

            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        });

        // Select Technique Complete -> Add Active Technique & Upgrade Tactic Level
        socket.on('Select Technique and Upgrade Tactic', async(companyName, section, categoryIndex) => {
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("Select Technique and Upgrade Tactic - companyName : ", companyName);
            console.log("Select Technique and Upgrade Tactic - section : ", section);
            console.log("Select Technique and Upgrade Tactic - categoryIndex : ", categoryIndex);

            // 선택 완료
            let tacticLevel = roomTotalJson[0][companyName]["penetrationTestingLV"];
            let techniqueBeActivationList = roomTotalJson[0][companyName]["sections"][section]["beActivated"];
            let techniqueActivation = roomTotalJson[0][companyName]["sections"][section]["defenseActive"];
            let techniqueLevel = roomTotalJson[0][companyName]["sections"][section]["defenseLv"];

            // 유니티에서 완료버튼 클릭 시 수정할 것!
            if (socket.team == true) {
                console.log("white team upgrade attack card");
                roomTotalJson[0][companyName]["penetrationTestingLV"][categoryIndex] += 1;
            }

            var alreadyAttackList = [];
            for(var i = 0; i < techniqueBeActivationList.length; i++){ 
                var sectionAttackProgressArr = roomTotalJson[0][companyName].sections[section].attackProgress;
                console.log("sectionAttackProgressArr : ", sectionAttackProgressArr);

                if (techniqueActivation[categoryIndex][techniqueBeActivationList[i]] == 2) {
                    // 0 나중에 시나리오 인덱스로 변경할 것
                    // sectionAttackProgressArr = sectionAttackProgressArr.filter(function(progress){
                    // sectionAttackProgressArr = sectionAttackProgressArr.filter(function(progress){
                    //     return progress.tactic == config.ATTACK_CATEGORY[categoryIndex] && progress.attackName == config.ATTACK_TECHNIQUE[categoryIndex][techniqueBeActivationList[i]];
                    // });
                    console.log("sectionAttackProgressArr : ", sectionAttackProgressArr);
                    console.log("sectionAttackProgressArr.state : ", sectionAttackProgressArr.state);

                    var attackJson = {category : categoryIndex, technique : techniqueBeActivationList[i], cooltime : config["DEFENSE_" + (categoryIndex + 1)]["time"][techniqueLevel[categoryIndex][techniqueBeActivationList[i]]],
                                        state : sectionAttackProgressArr[0].state, level : techniqueLevel[categoryIndex][techniqueBeActivationList[i]]};
                    alreadyAttackList.push(attackJson);
                }

                techniqueActivation[categoryIndex][techniqueBeActivationList[i]] = 1;
            }

            console.log("techniqueActivation : ", techniqueActivation);
            console.log("techniqueLevel : ", techniqueLevel);

            socket.emit("Get Technique", companyName, techniqueActivation, techniqueLevel);
            socket.emit("Get Tactic Level", companyName, tacticLevel);

            // 여러 공격도 처리될 수 있도록 하기
            for (var i = 0; i < alreadyAttackList.length; i++) {
                DefenseCooltime(socket, alreadyAttackList[i].state, companyName, section, alreadyAttackList[i].category, alreadyAttackList[i].technique, alreadyAttackList[i].level);
                socket.emit('Start Defense', companyName, section, alreadyAttackList[i].category, alreadyAttackList[i].technique, alreadyAttackList[i].cooltime);
            }

            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        });


        // 회사 몰락 여부 확인
        socket.on('On Main Map', async() => {
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("On Main Map roomTotalJson : ", roomTotalJson);

            let abandonStatusList = [];
            for(let company of companyNameList){
                abandonStatusList.push(roomTotalJson[0][company]["abandonStatus"]);
            }

            console.log("On Main Map abandonStatusList : ", abandonStatusList);
            socket.to(socket.room).emit('Company Status', abandonStatusList);
            socket.emit('Company Status', abandonStatusList);
        })
        

        socket.on('On Monitoring', async(companyName) => {
            console.log("On Monitoring companyName : ", companyName);
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            let company_blockedNum = 0;

            for (var userId in roomTotalJson[0]["blackTeam"]["users"]){
                console.log("[On Monitoring] user id : ", userId);
                if (roomTotalJson[0]["blackTeam"]["users"][userId][companyName]["IsBlocked"] == true){
                    company_blockedNum += 1;
                }
            }

            console.log("[On Monitoring] company_blockedNum : ", company_blockedNum);
        
            socket.to(socket.room+'true').emit("Blocked Num", company_blockedNum);
            socket.emit('Blocked Num', company_blockedNum);
        })

        socket.on("Send Chat", async(chat) => {
            console.log("[send chat] chatting : ", chat);

            let now_time = new Date();   
            let hours = now_time.getHours();
            let minutes = now_time.getMinutes();
            let timestamp = hours+":"+minutes;

            console.log("socket.color : ", socket.color);
            console.log("socket.color type : ", typeof(socket.color));

            socket.to(socket.room+socket.team).emit("Update Chat", timestamp, socket.nickname, socket.color, chat);
            socket.emit("Update Chat", timestamp, socket.nickname, socket.color, chat);

            chattingLogger.error('game:chatting', {
                server : server_ip,
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userID,
                nickname : socket.nickname,
                data : {
                    roomID : socket.roomID,
                    room : socket.room,
                    team : socket.team,
                    chatting : chat
                } 
            });
        })

        socket.on("Is Abandon Company", async(companyName) => {
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("Is Abandon Company : ", roomTotalJson[0][companyName].abandonStatus);
            if (roomTotalJson[0][companyName].abandonStatus) {
                socket.to(socket.room).emit('Abandon Company', companyName);
            }
        })

// ===================================================================================================================
        // [Security Monitoring] 영역 클릭 시 레벨 보이기
        socket.on('Section_Name_NonUP', async(data) => {
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            data = JSON.parse(data);
            var corpName = data.Corp;
            var sectionIdx = data.areaIdx;

            var area_level = sectionIdx.toString() + "-" + (roomTotalJson[0][corpName].sections[sectionIdx].level);
            io.sockets.in(socket.room+'true').emit('Now_Level', corpName, area_level.toString());
        });

        // [Security Monitoring] 영역 클릭 시 -> 유지보수 버튼 클릭 시로 수정 필요
        socket.on('Section_Name', async(data) => {
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var white_total_pita = roomTotalJson[0].whiteTeam.total_pita;

            data = JSON.parse(data);
            var corpName = data.Corp;
            var sectionIdx = data.areaIdx;
            
            if(white_total_pita - config.MAINTENANCE_SECTION_INFO.pita[roomTotalJson[0][corpName].sections[sectionIdx].level] < 0)
            {
                socket.emit("Short of Money");
            } else {
                // 최대 레벨 확인
                if(roomTotalJson[0][corpName].sections[sectionIdx].level >= config.MAX_LEVEL)
                {
                    socket.emit("Out of Level");
                } else 
                {
                    // json 변경 - pita 감소
                    var newTotalPita = white_total_pita - config.MAINTENANCE_SECTION_INFO.pita[roomTotalJson[0][corpName].sections[sectionIdx].level]; //pita 감소
                    roomTotalJson[0].whiteTeam.total_pita = newTotalPita;
                    roomTotalJson[0][corpName].sections[sectionIdx].level += 1; // 레벨 증가
                    var attackProgressLen = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress.length;
                    newLevel = roomTotalJson[0][corpName].sections[sectionIdx].level;

                    // 레벨에 맞게 의심 개수 갱신
                    newSusCnt = 0
                    switch (newLevel) {
                        case 1: // 1~5개
                            for (var i=0; i<attackProgressLen; i++){
                                newSusCnt = newSusCnt + (Math.floor(Math.random() * 5) + 1);
                            }
                            break;
                        case 2: // 1~3개
                            for (var i=0; i<attackProgressLen; i++){
                                newSusCnt = newSusCnt + Math.floor(Math.random() * 3) + 1;
                            }                            
                            break;
                        case 3: // 0~3개
                            for (var i=0; i<attackProgressLen; i++){
                                newSusCnt = newSusCnt + Math.floor(Math.random() * 4);
                            }                             
                            break;
                        case 4: // 0~2개
                            for (var i=0; i<attackProgressLen; i++){
                                newSusCnt = newSusCnt + Math.floor(Math.random() * 3);
                            } 
                            break;
                        case 5:
                            newSusCnt = attackProgressLen;
                            break;
                    }
                    roomTotalJson[0][corpName].sections[sectionIdx].suspicionCount = newSusCnt;
                    console.log("new sus CNT LV >> ", newSusCnt);
                    await jsonStore.updatejson(roomTotalJson[0], socket.room);

                    var area_level = sectionIdx.toString() + "-" + (roomTotalJson[0][corpName].sections[sectionIdx].level);
                    io.sockets.in(socket.room+'true').emit('New_Level', corpName, area_level.toString());
                    io.sockets.in(socket.room+'true').emit('Update Pita', newTotalPita);
                    io.sockets.in(socket.room+'true').emit('Issue_Count_Update', corpName);
                }
            }
        });


        // [Security Monitoring] 관제 issue Count
        socket.on('Get_Issue_Count', async(corp) => {            
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var corpName = corp;
            var sectionsArr = roomTotalJson[0][corpName].sections;
            var cntArr = [];
            sectionsArr.forEach( async(element, idx) => {
                var sectionData = element.suspicionCount;
                cntArr[idx] = sectionData;
            });
            socket.emit('Issue_Count', cntArr, corpName);
        });


        // [Security Monitoring] MonitoringLog 분석 결과 전송 및 자동 대응
        socket.on('Get_Monitoring_Log', async(corp) => {
            // 피타 확인 및 차감
            const roomTotalJson_pita = JSON.parse(await jsonStore.getjson(socket.room));
            var white_total_pita = roomTotalJson_pita[0].whiteTeam.total_pita;

            var corpName = corp;
            var areaArray = roomTotalJson_pita[0][corpName].sections;
            var totalSuspicionCount = 0;
            areaArray.forEach(element => {
                totalSuspicionCount += element.suspicionCount;
            });
            var totalCharge = (config.ANLAYZE_PER_ATTACKCNT * totalSuspicionCount);
            console.log("공격개수 총합 >> ", totalSuspicionCount, totalCharge);
            
            if(white_total_pita - totalCharge < 0)
            {
                socket.emit("Short of Money");
            } else {
                // pita 차감
                var newTotalPita = white_total_pita - totalCharge; //pita 감소
                // 분석 결과 전송 및 차감
                const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                var corpName = corp;
                var sectionsArr = roomTotalJson[0][corpName].sections;
                var logArr = [];
                roomTotalJson[0].whiteTeam.total_pita = newTotalPita;
                await jsonStore.updatejson(roomTotalJson[0], socket.room);

                sectionsArr.forEach( async(element, idx) => {
                    var sectionLogData = element.attackProgress;
                    sectionLogData.forEach(logElement => {
                        switch (logElement.state) {
                            case 1 :
                                var newLog = {
                                    area: areaNameList[idx],
                                    tactic: logElement.tactic,
                                    attackName: logElement.attackName + " is in progress."
                                }
                                break;
                            case 2 : 
                                var newLog = {
                                    area: areaNameList[idx],
                                    tactic: logElement.tactic,
                                    attackName: logElement.attackName + "has been carried out."
                                }
                                break;
                        }
                        logArr.push(newLog);
                    });                
                });
                //socket.emit('Monitoring_Log', logArr, corpName);
                io.sockets.in(socket.room+'true').emit('Monitoring_Log', logArr, corpName);
                // [GameLog] 로그 추가
                let today = new Date();   
                let hours = today.getHours(); // 시
                let minutes = today.getMinutes();  // 분
                let seconds = today.getSeconds();  // 초
                let now = hours+":"+minutes+":"+seconds;
                var gameLog = {time: now, nickname: "", targetCompany: corpName, targetSection: "", detail: "Log analysis is complete."};
                var logArr = [];
                logArr.push(gameLog);
                io.sockets.in(socket.room+'true').emit('addLog', logArr);

                // 자동대응
                // var sectionsArr = roomTotalJson[0][corpName].sections;
                sectionsArr.forEach( async(element, sectionIdx) => {
                    var sectionDefenseProgressArr = element.defenseProgress;
                    var sectionDefenseActivationArr = element.defenseActive;
                    var defenseLv = element.defenseLv;

                    var sectionAttackData = element.attackProgress;
                    sectionAttackData.forEach( async(attackElement) => {
                        console.log(attackElement.tactic, attackElement.attackName);
                        
                        var tacticIndex = config.ATTACK_CATEGORY.indexOf(attackElement.tactic);
                        var techniqueIndex = config.ATTACK_TECHNIQUE[tacticIndex].indexOf(attackElement.attackName);
                        console.log(attackElement.tactic, tacticIndex, attackElement.attackName, techniqueIndex, sectionDefenseActivationArr[tacticIndex][techniqueIndex]);

                        if (sectionDefenseActivationArr[tacticIndex][techniqueIndex] == 1){
                            var newInfo = { tactic: attackElement.tactic, attackName: attackElement.attackName, state: false }; 
                            sectionDefenseProgressArr[tacticIndex].push(newInfo);
                            console.log("sectionDefenseProgressArr - Deactivation: ", sectionDefenseProgressArr);
                            // 0은 나중에 시나리오 인덱스로 변경
                            DefenseCooltime(socket, newInfo.state, corpName, sectionIdx, tacticIndex, techniqueIndex, defenseLv[tacticIndex][techniqueIndex]);
                            socket.emit('Start Defense', corpName, sectionIdx, tacticIndex, techniqueIndex, config["DEFENSE_" + (tacticIndex + 1)]["time"][defenseLv[tacticIndex][techniqueIndex]]);
                        } else if (sectionDefenseActivationArr[tacticIndex][techniqueIndex] == 0) {
                            sectionDefenseActivationArr[tacticIndex][techniqueIndex] = 2;
                            let techniqueLevel = roomTotalJson[0][corpName]["sections"][sectionIdx]["defenseLv"];
                            socket.emit("Get Technique", corpName, sectionDefenseActivationArr, techniqueLevel);
                            console.log("sectionDefenseActivationArr - Deactivation : ", sectionDefenseActivationArr);
                        }

                        await jsonStore.updatejson(roomTotalJson[0], socket.room);
                    });
                });

            }
        });
      

        // // [Abandon] 한 회사의 모든 영역이 파괴되었는지 확인 후 몰락 여부 결정
        // socket.on('is_All_Sections_Destroyed', async(corpName) => {
        //     console.log("[Abandon]is_All_Sections_Destroyed " + corpName);
        //     const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            
        //     var isAbondon = true;
        //     var sectionsArr = roomTotalJson[0][corpName].sections;
        //     for(i=0; i<sectionsArr.length; i++)
        //     {
        //         var isDestroy = roomTotalJson[0][corpName].sections[i].destroyStatus;
        //         console.log("[Abandon]isDestroy " + i+isDestroy.toString());
        //         if(isDestroy == false){ // 한 영역이라도 false면 반복문 나감
        //             isAbondon = false;
        //             break;
        //         }
        //     }
        //     console.log("[Abandon] isAbondon " + isAbondon);

        //     if(isAbondon == true){ // 회사 몰락
        //         console.log("[Abandon] 회사몰락 " + corpName);
        //         roomTotalJson[0][corpName].abandonStatus = true;
        //         await jsonStore.updatejson(roomTotalJson[0], socket.room);

        //         // [GameLog] 로그 추가
        //         const blackLogJson = JSON.parse(await jsonStore.getjson(socket.room+":blackLog"));
        //         const whiteLogJson = JSON.parse(await jsonStore.getjson(socket.room+":whiteLog"));

        //         let today = new Date();   
        //         let hours = today.getHours(); // 시
        //         let minutes = today.getMinutes();  // 분
        //         let seconds = today.getSeconds();  // 초
        //         let now = hours+":"+minutes+":"+seconds;
        //         var monitoringLog = {time: now, nickname: "", targetCompany: corpName, targetSection: "", actionType: "Damage", detail: corpName+"회사가 파괴되었습니다"};

        //         blackLogJson[0].push(monitoringLog);
        //         whiteLogJson[0].push(monitoringLog);
        //         await jsonStore.updatejson(blackLogJson[0], socket.room+":blackLog");
        //         await jsonStore.updatejson(whiteLogJson[0], socket.room+":whiteLog");

        //         var logArr = [];
        //         logArr.push(monitoringLog);
        //         io.sockets.in(socket.room+'false').emit('addLog', logArr);
        //         io.sockets.in(socket.room+'true').emit('addLog', logArr);

        //         // 회사 아이콘 색상 변경
        //         let abandonStatusList = [];
        //         for(let company of companyNameList){
        //             abandonStatusList.push(roomTotalJson[0][company]["abandonStatus"]);
        //         }
                
        //         console.log("Section Destroy -> abandonStatusList : ", abandonStatusList);

        //         io.sockets.in(socket.room).emit('Company Status', abandonStatusList);  // 블랙, 화이트 두 팀 모두에게 보냄
        //         // io.sockets.in(socket.room).emit('Company Status', abandonStatusList);


        //         // 모든 회사가 몰락인지 확인
        //         AllAbandon(socket, roomTotalJson);

        //     }
            
        // });

        // // [Monitoring] monitoringLog 스키마 데이터 보내기
        // socket.on('Get_MonitoringLog', async(corp) => {
        //     const monitoringLogJson = JSON.parse(await jsonStore.getjson(socket.room+":whiteLog"));

        //     var jsonArray = [];
        //     for (var i=0; i<monitoringLogJson[0].length; i++) {
        //         if(monitoringLogJson[0][i]["targetCompany"] == corp){
        //             var newResult = {
        //                 time : monitoringLogJson[0][i]["time"],
        //                 nickname : monitoringLogJson[0][i]["nickname"],
        //                 targetCompany : corp,
        //                 targetSection : monitoringLogJson[0][i]["targetSection"],
        //                 actionType : monitoringLogJson[0][i]["actionType"],
        //                 detail : monitoringLogJson[0][i]["detail"]
        //             }
        //             jsonArray.push(newResult);
        //         } 
        //     }
        //     socket.emit('MonitoringLog', jsonArray);
        // });


        // [Result] 최종 결과 보내기
        socket.on('Get_Final_RoomTotal', async() => {
            //io.sockets.in(socket.room).emit('Timer END'); // 타이머 종료
            //socket.emit('Result_PAGE'); // 결과 페이지로 넘어가면 타이머, 로그 안보이게 하기

            // 양팀 남은 피타, 획득 호두, 승리팀
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var finalRoomTotal = {
                blackPita : roomTotalJson[0].blackTeam.total_pita,
                whitePita : roomTotalJson[0].whiteTeam.total_pita,
                winHodu : config.WIN_HODU,
                loseHodu : config.LOSE_HODU,
                tieHodu: config.TIE_HODU,
                winTeam : false
            }         

            // 사용자 정보 팀 별로 불러오기
            var blackUsersInfo = []; 
            var whiteUsersInfo = [];
            let infoJson = {};
            
            var RoomMembersList =  await redis_room.RoomMembers(socket.room);
            for (const member of RoomMembersList){
                var playerInfo = await redis_room.getMember(socket.room, member);
                if (playerInfo.team == false) {
                    infoJson = {UsersID : playerInfo.userID, nickname : playerInfo.nickname, UsersProfileColor : playerInfo.color}
                    blackUsersInfo.push(infoJson);
                }
                else {
                    infoJson = {UsersID : playerInfo.userID, nickname : playerInfo.nickname, UsersProfileColor : playerInfo.color}
                    whiteUsersInfo.push(infoJson);
                }
            }

            io.sockets.in(socket.room).emit('playerInfo', blackUsersInfo, whiteUsersInfo, JSON.stringify(finalRoomTotal));
            // socket.emit('playerInfo', blackUsersInfo, whiteUsersInfo, JSON.stringify(finalRoomTotal)); // 플리이어 정보(닉네임, 프로필 색) 배열, 양팀 피타, 호두, 승리팀 정보 전송
        });

        // [Result]
        socket.on('All_abandon_test', async() => {
            // 양팀 남은 피타, 획득 호두, 승리팀
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            for(let company of companyNameList){
                roomTotalJson[0][company]["abandonStatus"] = true;
            }
            await jsonStore.updatejson(roomTotalJson[0], socket.room);

            AllAbandon(socket, roomTotalJson);
        });

// ===================================================================================================================

        socket.on('click_technique_button', async(data, attackName, tacticName) => {
            console.log("wasd >> ", attackName, tacticName);
            if(attackName.includes("\n")) { attackName = attackName.substring(1); }

            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            data = JSON.parse(data);
            var corpName = data.Corp;
            var sectionIdx = data.areaIdx;
            var tacticIdx = taticNamesList.indexOf(tacticName);
            var attackProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;
            var attackLv = roomTotalJson[0][corpName].attackLV[tacticIdx];
            var suspicionCount = roomTotalJson[0][corpName].sections[sectionIdx].suspicionCount;
            var areaLv = roomTotalJson[0][corpName].sections[sectionIdx].level;
            var currentPita = roomTotalJson[0].blackTeam.total_pita;

            if (attackLv == 0) {
                socket.emit('Failed to success level');
                return;
            }

            var lvPita = config["ATTACK_" + (tacticIdx + 1)]["pita"][attackLv - 1];
            if (currentPita - lvPita < 0) {
                socket.emit('Short of Money');
                return;
            }

            roomTotalJson[0].blackTeam.total_pita = currentPita - lvPita;

            var lvCoolTime = config["ATTACK_" + (tacticIdx + 1)]["time"][attackLv - 1];

            // 유니티에 쿨타임 시간(레벨별) 전송
            socket.emit('CoolTime_LV', lvCoolTime, corpName);

            // 공격 중복 확인
            var overlap = false;
            console.log("attackProgressArr >> ", attackProgressArr);
            attackProgressArr.forEach(element => {
                if(element.attackName == attackName) {
                    overlap = true;
                    console.log("공격 중복");
                    return false;
                }
            });

            if(!overlap) {
                // state 1로 공격 저장
                var newInfo = { tactic: tacticName, attackName: attackName, state: 1 }; 
                attackProgressArr.push(newInfo);
                // 영역 레벨에 따른 의심 개수 갱신
                var fakeCnt = 0;
                switch (areaLv) {
                    case 1: // 1~5개
                        fakeCnt = Math.floor(Math.random() * 5) + 1;
                        break;
                    case 2: // 1~3개
                        fakeCnt = Math.floor(Math.random() * 3) + 1;
                        break;
                    case 3: // 0~3개
                        fakeCnt = Math.floor(Math.random() * 4);
                        break;
                    case 4: // 0~2개
                        fakeCnt = Math.floor(Math.random() * 3);
                        break;
                }
                suspicionCount = (suspicionCount + 1) + fakeCnt;
                roomTotalJson[0][corpName].sections[sectionIdx].suspicionCount = suspicionCount;
                console.log("sus CNT >> ", suspicionCount);
                await jsonStore.updatejson(roomTotalJson[0], socket.room);

                // 관제 issue Count 갱신 신호 유니티에 전송
                io.sockets.in(socket.room+'true').emit('Issue_Count_Update', corpName);

                // 쿨타임 및 성공 여부 결정(by.성공률)
                AttackCoolTime(socket, (lvCoolTime*1000), corpName, sectionIdx, tacticIdx, attackLv, tacticName, attackName); // (socket, corpName, sectionIdx, attackIdx, tacticIdx, attackLv, tacticName, attackName)

            }
        });

// ###################################################################################################################
        
        socket.on('disconnect', async function() {
            console.log('A Player disconnected!!! - socket.sessionID : ', socket.sessionID);
            clearInterval(timerId)
            clearInterval(pitaTimerId);
            console.log("[disconnect] 타이머 종료!");

            
            if (socket.room){
                await leaveRoom(socket, socket.room);
            }
            
            lobbyLogger.info('mainHome:logout', {
                server : server_ip,
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userID,
                nickname : socket.nickname,
                data : {status : 1} 
            });

            await sessionStore.deleteSession(socket.sessionID);
        });
    })


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
        console.log("PlaceUser 함수---!");

        // var roomPin = socket.room;
        var userPlacementName ;

        if(!team){ //false(0)면 black
            userPlacementName =  'blackPlacement';
        }else{
            userPlacementName =  'whitePlacement';
        } 

        console.log("userPlacementName " , userPlacementName);

        var userPlacement =await hashtableStore.getHashTableFieldValue(roomPin, [userPlacementName], 'roomManage');
        console.log("userPlacement " , userPlacement);

        if(!userPlacement)// 널처리
        {
            return -1
        }

        userPlacement = userPlacement[0].split('');
        console.log("userPlacement.split() " , userPlacement);
        var place =  userPlacement.pop();

        var newUserPlacement =  userPlacement.join('');
        console.log("AFTER! userPlacement.join('')" , newUserPlacement);
        await hashtableStore.updateHashTableField(roomPin, userPlacementName, newUserPlacement, 'roomManage');


        console.log("[PlaceUser] 반환 team : ", team, " place : ", place); 
      
        return place
    }

    // [WaitingRoom] UI player 대응 컴포넌트 idx 제거
    async function DeplaceUser(roomPin, prevTeam, idx){
        console.log("DeplaceUser 함수---! return idx : ", idx);

        // var roomPin = socket.room;
        var userPlacementName ;

        if(!prevTeam){ // false(0) 면 black팀
            userPlacementName =  'blackPlacement';
        }else{
            userPlacementName =  'whitePlacement';
        }

        console.log("userPlacementName " , userPlacementName);

        var userPlacement = await hashtableStore.getHashTableFieldValue(roomPin, [userPlacementName], 'roomManage');
        // console.log("userPlacement " , userPlacement);
        userPlacement = userPlacement[0].split('');
        // console.log("userPlacement.split() " , userPlacement);
        userPlacement.push(idx);
        // console.log("$$DeplaceUser  userPlacement : " ,userPlacement);

        userPlacement =  userPlacement.join('');
        console.log("AFTER! userPlacement" , userPlacement);
        console.log("check!! ", await hashtableStore.updateHashTableField(roomPin, userPlacementName, userPlacement, 'roomManage'));
    }

    async function createRoom(roomType, maxPlayer){
        //  1. redis - room에 저장
        var roomPin = randomN();
        var roomID = randomId();
        while (redis_room.checkRooms(roomPin))
        {
            console.log("룸키 중복 발생_룸 키 재발급");
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
         /*
                < 로직 > 
                1. 해당 룸 핀이 있는지 확인
                2. 해당 룸에 들어갈 수 있는지 (full상태 확인)
                3. permission 주기 (socket.room 저장, 방 상태 update 및 cnt ++)
        */

        // 1. 해당 룸 핀이 있는지 확인
        if (! await redis_room.IsValidRoom(roomPin)) { 
            console.log("permission False - no Room");
            return -1
        }

        // 2. 해당 룸에 들어갈 수 있는지 (full상태 확인)
        console.log("room_member 수", await redis_room.RoomMembers_num(roomPin))
        if (await redis_room.RoomMembers_num(roomPin) >= JSON.parse(await redis_room.getRoomInfo(roomPin)).maxPlayer){
            console.log("permission False - room Full");
            return 0
        }

        return 1
    };

    // 팀 교체 함수 (type 1) 
    async function switchTeamType1(socket, playerInfo){


    };

    // 방 나가는  함수
    async function leaveRoom(socket, roomPin){

        // 1. 해당 인원이 나가면 room null인지 확인 (user 0명인 경우 룸 삭제)
        if (await redis_room.RoomMembers_num(roomPin) <= 1){
            console.log("[룸 삭제]!");
            redis_room.deleteRooms(roomPin); // 1) redis 기본 room 삭제

            var redisroomKey = await hashtableStore.getHashTableFieldValue(roomPin, ['roomType'], 'roomManage'); // 3번 과정을 위해 roomType 가져오기
            console.log('redisroomKey : ',redisroomKey, 'roomPin : ', roomPin);
            console.log('hashtableStore.deleteHashTable', hashtableStore.deleteHashTable(roomPin,'roomManage')); // 2) roomManage room 삭제
            console.log('listStore.delElementList : ', listStore.delElementList(redisroomKey[0] + 'Room', 0, roomPin, 'roomManage')); // 3) roomManage list에서 삭제
              
            // 2. 방에 emit하기 (나갈려고 하는 사용자에게 보냄)
            socket.emit('logout'); 

            // 3. 방에 emit하기 (그 외 다른 사용자들에게 나간 사람정보 보냄_
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
        else{  // 나중에 if에 return 추가해서 else는 없애주기 
            // 1) roomManage room 인원 수정
            // userCnt, blackUserCnt/whiteUserCnt, blackPlacement/whitePlacement, profileColors  수정 필요

            // 주의! DeplaceUser부터 해줘야함
            var userInfo = await redis_room.getMember(socket.room, socket.userID);
            console.log(" userInfo : " ,userInfo, userInfo.place);
            if (socket.team){
                await DeplaceUser(roomPin, socket.team, userInfo.place); // blackPlacement/whitePlacement  -> DeplaceUser
            }else{
                await DeplaceUser(roomPin, socket.team, userInfo.place);  // blackPlacement/whitePlacement  -> DeplaceUser
            }
            
            var roomManageInfo = await hashtableStore.getAllHashTable(roomPin, 'roomManage'); ;
            console.log("[[[ 수정전 ]]] roomManageInfo" , roomManageInfo);


            // userCnt 변경
            roomManageInfo.userCnt = roomManageInfo.userCnt - 1;

            // blackUserCnt/whiteUserCnt 변경
            // toBlackUsers, toWhiteUsers 초기화
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
                console.log("나 - 웨이팅 리스트에서 삭제함");
                var mywaitingList = roomManageInfo[myWaitingField].split(',');
                roomManageInfo[myWaitingField] = mywaitingList.filter(function(userID) {
                    return userID != socket.userID;
                });
            }

            // profileColor 변경 
            console.log("socket.color ", socket.color);
            roomManageInfo.profileColors = roomManageInfo.profileColors.replaceAt(socket.color, '0');
            console.log("roomManageInfo.profileColors", roomManageInfo.profileColors);

            // readycnt 변경 
            if(userInfo.status == 1){
                roomManageInfo.readyUserCnt -= 1 ;
            }
        
            console.log("[[[수정 후 ]]] roomManageInfo" , roomManageInfo);
            await hashtableStore.storeHashTable(roomPin, roomManageInfo, 'roomManage');


            // 2)  Redis - room 인원에서 삭제
            redis_room.delMember(roomPin, socket.userID);

            // 2. 방에 emit하기 (나갈려고 하는 사용자에게 보냄)
            socket.emit('logout'); 

            // 3. 방에 emit하기 (그 외 다른 사용자들에게 나간 사람정보 보냄_
            socket.broadcast.to(roomPin).emit('userLeaved',socket.userID);  
    
            // 4. (join삭제) 
            socket.leave(roomPin);

            ////---------------- 후 처리
            // 3) 다른 유저의 teamChange 가능한지 확인 후 정보 저장
            var otherswaitingList;
            if(roomManageInfo[othersWaitingField].length != 0){
                console.log("다른유저 -팀 체인지 진행");
                otherswaitingList = othersWaitingData[0].split(',');

                console.log("otherswaitingList : " , otherswaitingList);

                var mateUserID = otherswaitingList.shift();
                var matePlayerInfo = await redis_room.getMember(room, mateUserID);
                console.log("mate 정보 : " , matePlayerInfo);

                matePlayerInfo.place = userInfo.place;
                matePlayerInfo.team = userInfo.team ;
                matePlayerInfo.status = 0;
                await redis_room.updateMember(room, mateUserID, matePlayerInfo);

                var teamChangeInfo = { 
                    type : 1,
                    player1 : matePlayerInfo
                };
                
                // teamchange 정보 보내기 
                console.log('JSON.stringify(changeInfo); : ', JSON.stringify(changeInfo));
                io.sockets.in(socket.room).emit('updateTeamChange', JSON.stringify(teamChangeInfo));
            }

            // 3) roomManage list 인원 확인 (함수로 따로 빼기)
            // 만약 해당 룸이 full이 아니면 list에 추가해주기
            var redisroomKey =  roomManageInfo.roomType + 'Room';
            var publicRoomList = await listStore.rangeList(redisroomKey, 0, -1, 'roomManage');

            if (!publicRoomList.includes(roomPin) && (await redis_room.RoomMembers_num(roomPin) <= JSON.parse(await redis_room.getRoomInfo(roomPin)).maxPlayer)){
                await listStore.rpushList(redisroomKey, roomPin, false, 'roomManage');
                console.log("roomManage의 list에 추가됨");
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
    

        // 5. 나머지 room 관련 정보 socket에서 삭제 및 빈 값으로 수정해주기!!
        socket.room = null;
        socket.roomID = null;
        socket.team = null;
        socket.color = null;
    };


    // [GameStart] 게임시작을 위해 게임 스키마 초기화 
    function InitGame(room_key, blackUsersInfo, whiteUsersInfo){
        console.log("INIT GAME 호출됨------! blackUsersID", blackUsersInfo);


        /*
            var blackUsers = [ user1ID, user2ID, user3ID ];
        */

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
                sections : [
                    new Section({
                        attackable : true,
                        defensible : true,
                        destroyStatus : true ,
                        level  : 1,
                        suspicionCount : 1,
                        attackProgress : [],
                        // attackSenarioProgress  : [ ['Gather Victim Network Information', 'Exploit Public-Facing Application', 'Phishing'] ],
                        attackSenarioProgress  : [[], [], [], [], []],
                        defenseProgress : [[], [], [], [], []],
                        beActivated : [],
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
                                'Command and Scripting Interpreter' : {"Account Manipulation": false, "Scheduled Task/Job": false},
                                'Software Deployment Tools' : {"Account Manipulation": false, "Scheduled Task/Job": false},
                                'Account Manipulation' : {"Abuse Elevation Control Mechanism": false, "Indirect Command Execution": false},
                                'Scheduled Task/Job' : {"Screen Capture": false,"Exfiltration Over Alternative Protocol": false,"Exfiltration Over Web Service": false},
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
                                "Clipboard Data" : {"Ingress Tool Transfer": false,  "System Shutdown/Reboot": false},
                                "Data from Local System" : {"Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown/Reboot" : false},
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
                                "Process Injection" : {"Deobfuscate/Decode Files or Information": false,"Multi-Factor Authentication Interception": false, "Masquerading": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate/Decode Files or Information" : {"Multi-Factor Authentication Interception": false},
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
                                "Modify Registry" : {"Brute Force": false,"Browser Bookmark Discovery": false, "File and Directory Discovery": false, "Network Share Discovery": false, "Process Discovery": false, "System Information Discovery": false, "System Network Connections Discovery": false, "System Owner/User Discovery": false},
                                "Browser Bookmark Discovery" :  {"Clipboard Data": false},
                                "File and Directory Discovery":  {"Clipboard Data": false},
                                "Network Share Discovery":  {"Data from Local System": false},
                                "Process Discovery":  {"Data from Local System": false}, 
                                "System Information Discovery":  {"Data from Local System": false},
                                "System Network Connections Discovery":  {"Data from Local System": false},
                                "System Owner/User Discovery":  {"Data from Local System": false},
                                "Clipboard Data":  {"System Shutdown/Reboot": false },
                                "Data from Local System" :  {"Ingress Tool Transfer": false, "Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown/Reboot": false }
                            },

                            // scenario 5
                            {
                                "startAttack" : {"Drive-by Compromise" : false, "Exploit Public-Facing Application" : false},
                                "Drive-by Compromise": {"Windows Management Instrumentation": false},
                                "Exploit Public-Facing Application": {"Windows Management Instrumentation": false},
                                "Windows Management Instrumentation" :{"Scheduled Task/Job": false},
                                "Scheduled Task/Job" : {"Deobfuscate/Decode Files or Information": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate/Decode Files or Information" : {"Domain Trust Discovery": false, "System Network Configuration Discovery": false,  "System Owner/User Discovery" : false },
                                "Modify Registry" : {"Process Discovery": false},
                                "Obfuscated Files or Information"  : {"Remote System Discovery": false, "System Network Configuration Discovery": false, "System Network Connections Discovery": false, "System Owner/User Discovery": false, "System Service Discovery": false },
                                "Domain Trust Discovery" : {"Proxy": false},
                                "Process Discovery" : {"Proxy": false},
                                "Remote System Discovery" : {"Exploitation of Remote Services": false},
                                "System Network Configuration Discovery": {"Proxy": false},
                                "System Network Connections Discovery":{"Proxy": false},
                                "System Owner/User Discovery":{"Proxy": false},
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
                        // attackSenarioProgress  : [ ['Gather Victim Network Information', 'Exploit Public-Facing Application', 'Phishing'] ],
                        attackSenarioProgress  : [[], [], [], [], []],
                        defenseProgress : [[], [], [], [], []],
                        beActivated : [],
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
                                'Command and Scripting Interpreter' : {"Account Manipulation": false, "Scheduled Task/Job": false},
                                'Software Deployment Tools' : {"Account Manipulation": false, "Scheduled Task/Job": false},
                                'Account Manipulation' : {"Abuse Elevation Control Mechanism": false, "Indirect Command Execution": false},
                                'Scheduled Task/Job' : {"Screen Capture": false,"Exfiltration Over Alternative Protocol": false,"Exfiltration Over Web Service": false},
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
                                "Clipboard Data" : {"Ingress Tool Transfer": false,  "System Shutdown/Reboot": false},
                                "Data from Local System" : {"Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown/Reboot" : false},
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
                                "Process Injection" : {"Deobfuscate/Decode Files or Information": false,"Multi-Factor Authentication Interception": false, "Masquerading": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate/Decode Files or Information" : {"Multi-Factor Authentication Interception": false},
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
                                "Modify Registry" : {"Brute Force": false,"Browser Bookmark Discovery": false, "File and Directory Discovery": false, "Network Share Discovery": false, "Process Discovery": false, "System Information Discovery": false, "System Network Connections Discovery": false, "System Owner/User Discovery": false},
                                "Browser Bookmark Discovery" :  {"Clipboard Data": false},
                                "File and Directory Discovery":  {"Clipboard Data": false},
                                "Network Share Discovery":  {"Data from Local System": false},
                                "Process Discovery":  {"Data from Local System": false}, 
                                "System Information Discovery":  {"Data from Local System": false},
                                "System Network Connections Discovery":  {"Data from Local System": false},
                                "System Owner/User Discovery":  {"Data from Local System": false},
                                "Clipboard Data":  {"System Shutdown/Reboot": false },
                                "Data from Local System" :  {"Ingress Tool Transfer": false, "Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown/Reboot": false }
                            },

                            // scenario 5
                            {
                                "startAttack" : {"Drive-by Compromise" : false, "Exploit Public-Facing Application" : false},
                                "Drive-by Compromise": {"Windows Management Instrumentation": false},
                                "Exploit Public-Facing Application": {"Windows Management Instrumentation": false},
                                "Windows Management Instrumentation" :{"Scheduled Task/Job": false},
                                "Scheduled Task/Job" : {"Deobfuscate/Decode Files or Information": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate/Decode Files or Information" : {"Domain Trust Discovery": false, "System Network Configuration Discovery": false,  "System Owner/User Discovery" : false },
                                "Modify Registry" : {"Process Discovery": false},
                                "Obfuscated Files or Information"  : {"Remote System Discovery": false, "System Network Configuration Discovery": false, "System Network Connections Discovery": false, "System Owner/User Discovery": false, "System Service Discovery": false },
                                "Domain Trust Discovery" : {"Proxy": false},
                                "Process Discovery" : {"Proxy": false},
                                "Remote System Discovery" : {"Exploitation of Remote Services": false},
                                "System Network Configuration Discovery": {"Proxy": false},
                                "System Network Connections Discovery":{"Proxy": false},
                                "System Owner/User Discovery":{"Proxy": false},
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
                        // attackSenarioProgress  : [ ['Gather Victim Network Information', 'Exploit Public-Facing Application', 'Phishing'] ],
                        attackSenarioProgress  : [[], [], [], [], []],
                        defenseProgress : [[], [], [], [], []],
                        beActivated : [],
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
                                'Command and Scripting Interpreter' : {"Account Manipulation": false, "Scheduled Task/Job": false},
                                'Software Deployment Tools' : {"Account Manipulation": false, "Scheduled Task/Job": false},
                                'Account Manipulation' : {"Abuse Elevation Control Mechanism": false, "Indirect Command Execution": false},
                                'Scheduled Task/Job' : {"Screen Capture": false,"Exfiltration Over Alternative Protocol": false,"Exfiltration Over Web Service": false},
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
                                "Clipboard Data" : {"Ingress Tool Transfer": false,  "System Shutdown/Reboot": false},
                                "Data from Local System" : {"Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown/Reboot" : false},
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
                                "Process Injection" : {"Deobfuscate/Decode Files or Information": false,"Multi-Factor Authentication Interception": false, "Masquerading": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate/Decode Files or Information" : {"Multi-Factor Authentication Interception": false},
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
                                "Modify Registry" : {"Brute Force": false,"Browser Bookmark Discovery": false, "File and Directory Discovery": false, "Network Share Discovery": false, "Process Discovery": false, "System Information Discovery": false, "System Network Connections Discovery": false, "System Owner/User Discovery": false},
                                "Browser Bookmark Discovery" :  {"Clipboard Data": false},
                                "File and Directory Discovery":  {"Clipboard Data": false},
                                "Network Share Discovery":  {"Data from Local System": false},
                                "Process Discovery":  {"Data from Local System": false}, 
                                "System Information Discovery":  {"Data from Local System": false},
                                "System Network Connections Discovery":  {"Data from Local System": false},
                                "System Owner/User Discovery":  {"Data from Local System": false},
                                "Clipboard Data":  {"System Shutdown/Reboot": false },
                                "Data from Local System" :  {"Ingress Tool Transfer": false, "Data Destruction": false,"Data Encrypted for Impact": false, "System Shutdown/Reboot": false }
                            },

                            // scenario 5
                            {
                                "startAttack" : {"Drive-by Compromise" : false, "Exploit Public-Facing Application" : false},
                                "Drive-by Compromise": {"Windows Management Instrumentation": false},
                                "Exploit Public-Facing Application": {"Windows Management Instrumentation": false},
                                "Windows Management Instrumentation" :{"Scheduled Task/Job": false},
                                "Scheduled Task/Job" : {"Deobfuscate/Decode Files or Information": false, "Modify Registry": false, "Obfuscated Files or Information" : false},
                                "Deobfuscate/Decode Files or Information" : {"Domain Trust Discovery": false, "System Network Configuration Discovery": false,  "System Owner/User Discovery" : false },
                                "Modify Registry" : {"Process Discovery": false},
                                "Obfuscated Files or Information"  : {"Remote System Discovery": false, "System Network Configuration Discovery": false, "System Network Connections Discovery": false, "System Owner/User Discovery": false, "System Service Discovery": false },
                                "Domain Trust Discovery" : {"Proxy": false},
                                "Process Discovery" : {"Proxy": false},
                                "Remote System Discovery" : {"Exploitation of Remote Services": false},
                                "System Network Configuration Discovery": {"Proxy": false},
                                "System Network Connections Discovery":{"Proxy": false},
                                "System Owner/User Discovery":{"Proxy": false},
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
                scenarioLevel : [-1,-1,-1, -1, -1], // 힌트북 레벨
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

    // Attack 쿨타임
    async function AttackCoolTime(socket, lvCoolTime, corpName, sectionIdx, tacticIdx, attackLv, tacticName, attackName){
        console.log("attack 쿨타임 시작 - 서버",lvCoolTime );
        var attackTime = setTimeout(async function(){
            console.log("attack 쿨타임 종료 - 서버");

            let prob = config["ATTACK_" + (tacticIdx + 1)]["success"][attackLv] * 0.01;
            let percent = Math.random();
            console.log("prob : ", prob, ", percent : ", percent); 
            prob = 1; // test

            // 공격 성공 (by.성공률)
            if (prob >= percent) {
                let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                var attackProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;
                console.log("attackProgressArr<< ", attackProgressArr);
    
                // state 2로 변경
                attackProgressArr.filter( async (element) => {
                    if(element.attackName == attackName && element.state == 1) {
                        element.state = 2;
                    }
                })

                roomTotalJson[0][corpName].sections[sectionIdx].attackProgress = attackProgressArr;
                await jsonStore.updatejson(roomTotalJson[0], socket.room);
    
                const roomTotalJson2 = JSON.parse(await jsonStore.getjson(socket.room));
                var sectionAttackProgressArr2 = roomTotalJson2[0]["companyA"].sections[0].attackProgress;
                console.log("state2 test: ", sectionAttackProgressArr2);

                // [GameLog] 로그 추가
                let today = new Date();   
                let hours = today.getHours(); // 시
                let minutes = today.getMinutes();  // 분
                let seconds = today.getSeconds();  // 초
                let now = hours+":"+minutes+":"+seconds;
                var gameLog = {time: now, nickname: socket.nickname, targetCompany: corpName, targetSection: areaNameList[sectionIdx], detail: attackName+" is completed."};

                var logArr = [];
                logArr.push(gameLog);
                io.sockets.in(socket.room+'false').emit('addLog', logArr);

                // 시나리오 포함 여부 확인 함수 호출
                CheckScenarioAttack(socket, corpName, sectionIdx, tacticName, attackName); 

                // if(attackProgressArr[attackIdx].state == 1) {
                //     attackProgressArr[attackIdx].state = 2;
                //     await jsonStore.updatejson(roomTotalJson[0], socket.room);
    
                //     const roomTotalJson2 = JSON.parse(await jsonStore.getjson(socket.room));
                //     var sectionAttackProgressArr2 = roomTotalJson2[0]["companyA"].sections[0].attackProgress;
                //     console.log("test: ", sectionAttackProgressArr2);
                // }

            // 공격 실패 (by.성공률)
            } else{
                console.log("Failed due to success rate!!");
                socket.emit('Failed to success rate');

                let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                var attackProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;
                console.log("attackProgressArr<< ", attackProgressArr);

                // state 1인 해당 공격 attackProgress에서 제거
                attackProgressArr.filter(async (element, index) => {
                    if(element.attackName == attackName && element.state == 1) {
                        attackProgressArr.splice(index, 1);
                        console.log("state 1 remove >> ", attackProgressArr);

                        await jsonStore.updatejson(roomTotalJson[0], socket.room);
    
                        const roomTotalJson2 = JSON.parse(await jsonStore.getjson(socket.room));
                        var sectionAttackProgressArr2 = roomTotalJson2[0]["companyA"].sections[0].attackProgress;
                        console.log("delete test: ", sectionAttackProgressArr2);
                    }
                });

            }
            clearTimeout(attackTime);

        }, lvCoolTime);
    }

    async function CheckScenarioAttack(socket, corpName, sectionIdx, tacticName, attackName){
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var attackSenarioProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackSenarioProgress;
        var attackProgress = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;
        var attackConn = roomTotalJson[0][corpName].sections[sectionIdx].attackConn;
        
        // startAttack인지 확인
        for (var i = 0; i < attackConn.length; i++) {
            var scenarioName = "SCENARIO" + (i + 1);
            var startAttackArr = (Object.values(config[scenarioName].startAttack));
            console.log("startAttackArr : ", startAttackArr);
            console.log("attackName : ", attackName);

            if(startAttackArr.includes(attackName)) {
                console.log("start attack!!");
                var newInfo = { tactic: tacticName, attackName: attackName }; 
                attackSenarioProgressArr[i].push(newInfo);
                attackConn[i]["startAttack"][attackName] = true;
                socket.emit('Attack Success');
                console.log("attackConn : ", attackConn);
            } else {
                console.log("not start attack!!");
                for(key in attackConn[i]) {
                    var attackConnArr = (Object.keys(attackConn[i][key]));
                    if (attackConnArr.includes(attackName)) {
                        console.log("키 존재 attack!! : ", attackName);
                        if (attackConnArr[attackName] == true) {
                            console.log("키 값이 true attack!!");
                            var newInfo = { tactic: tacticName, attackName: attackName }; 
                            attackSenarioProgressArr[i].push(newInfo);
                            socket.emit('Attack Success');
                        } else {
                            console.log("키 값이 false attack!!");
                            // 나중에 tactic도 같이 필터링해줄 수 있는 방법 찾아야 됨
                            var attackInfo = attackProgress.filter(function(progress){
                                return progress.attackName == attackName && progress.tactic == tacticName;
                            })[0];

                            console.log("attackProgress : ", attackProgress);
                            console.log("attackInfo : ", attackInfo);
                            console.log("attackName : ", attackName);
                            console.log("tacticName : ", tacticName);
                            
                            if (typeof attackInfo != "undefined" && attackInfo.state == 2) {
                                var parents = config[scenarioName].attackConnParent[key];
                                console.log("parents : ", parents);

                                if (typeof parents != "undefined" && parents.length > 0){ 
                                    for (var pIdx = 0; pIdx < parents.length; pIdx++) {
                                        console.log("parents[pIdx] : ", parents[pIdx]);
                                        console.log("key : ", key);
                                        console.log("i : ", i);
                                        console.log("pIdx : ", pIdx);
                                        console.log("attackConn[i][parents[pIdx]][key] : ", attackConn[i][parents[pIdx]][key]);
                                        if (attackConn[i][parents[pIdx]][key] == true) {
                                            var newInfo = { tactic: tacticName, attackName: attackName }; 
                                            attackSenarioProgressArr[i].push(newInfo);
                                            attackConn[i][key][attackName] = true;
                                            socket.emit('Attack Success');
                                            console.log("attackConn : ", attackConn);

                                            var mainAttackArr = (Object.values(config["SCENARIO" + (i+1)].mainAttack));
                                            console.log("mainAttackArr : ", mainAttackArr);
                                            console.log("mainAttackArr[mainAttackArr.length -1] : ", mainAttackArr[mainAttackArr.length -1]);
                                            if (mainAttackArr[mainAttackArr.length -1] == attackName && sectionIdx == 2) {
                                                console.log("abandonStatus : false to true : ", attackName);
                                                roomTotalJson[0][corpName].abandonStatus = true;
                                                io.sockets.in(socket.room).emit("Abandon Company", corpName);
                                                AllAbandon(socket, roomTotalJson);
                                            } else if (mainAttackArr[-1] == attackName) {
                                                roomTotalJson[0][corpName].sections[sectionIdx].destroyStatus = true;
                                                roomTotalJson[0][corpName].sections[sectionIdx+1].attackable = true;
                                            }

                                            break;
                                        }
                                    }
                                } else if (startAttackArr.includes(key)) {
                                    var newInfo = { tactic: tacticName, attackName: attackName }; 
                                    attackSenarioProgressArr[i].push(newInfo);
                                    attackConn[i][key][attackName] = true;
                                    socket.emit('Attack Success');
                                    console.log("attackConn : ", attackConn);
                                }
                            }
                        }
                    }
                }
            }
        
            // console.log("attackConn : ", attackConn);
        }

        roomTotalJson[0][corpName].sections[sectionIdx].attackSenarioProgress = attackSenarioProgressArr;

        await jsonStore.updatejson(roomTotalJson[0], socket.room);

        const roomTotalJson2 = JSON.parse(await jsonStore.getjson(socket.room));
        var attackSenarioProgressArr2 = roomTotalJson2[0][corpName].sections[sectionIdx].attackSenarioProgress;
        console.log(attackSenarioProgressArr2);
    }

    // Defense 쿨타임
    async function DefenseCooltime(socket, attackStateOrigin, corpName, sectionIdx, tacticIndex, techniqueIndex, defenseLevel){
        var defenseTime = setTimeout(async function(){
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            var sectionDefenseProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].defenseProgress;
            var sectionAttackProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;
            var defenseCntArr = roomTotalJson[0][corpName].sections[sectionIdx].defenseCnt;
            var defenseLvArr = roomTotalJson[0][corpName].sections[sectionIdx].defenseLv;

            console.log("tacticIndex : ", tacticIndex);
            console.log("techniqueIndex : ", techniqueIndex);
            
            var attackInfo = sectionAttackProgressArr.filter(function(progress){
                return progress.tactic == config.ATTACK_CATEGORY[tacticIndex] && progress.attackName == config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex];
            })[0];

            console.log("attackInfo : ", attackInfo);

            if (typeof attackInfo != "undefined") {
                let prob = config["DEFENSE_" + (tacticIndex + 1)]["success"][defenseLevel] * 0.01;
                let percent = Math.random();

                console.log("prob : ", prob, ", percent : ", percent); 

                // 대응 성공
                if (prob >= percent) {
                    console.log("DefenseCooltime - attackInfo : ", attackInfo);
                    console.log("DefenseCooltime - config.ATTACK_CATEGORY[tacticIndex] : ", config.ATTACK_CATEGORY[tacticIndex]);
                    console.log("DefenseCooltime - config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex] : ", config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex]);
                    
                    console.log("DefenseCooltime - sectionAttackProgressArr (before) : ", sectionAttackProgressArr);
                    console.log("DefenseCooltime - sectionDefenseProgressArr (before) : ", sectionDefenseProgressArr);
        
                    // 방어 성공 (attackStateOrigin -> attackState : 1 -> 1 or 2 -> 2)
                    console.log("DefenseCooltime - attackStateOrigin : ", attackStateOrigin);
                    console.log("DefenseCooltime - attackInfo.state : ", attackInfo.state);
                    if (attackStateOrigin == attackInfo.state) {
                        console.log("DefenseCooltime - success!!");
        
                        sectionAttackProgressArr = sectionAttackProgressArr.filter(function(progress){
                            return progress.tactic != config.ATTACK_CATEGORY[tacticIndex] && progress.attackName != config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex];
                        });
        
                        sectionDefenseProgressArr = sectionDefenseProgressArr.filter(function(progress){
                            return progress.tactic != config.ATTACK_CATEGORY[tacticIndex] && progress.attackName != config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex];
                        });

                        defenseCntArr[tacticIndex][techniqueIndex] += 1;

                        if (defenseLvArr != 5 & defenseCntArr[tacticIndex][techniqueIndex] > config.DEFENSE_TECHNIQUE_UPGRADE) {
                            defenseLvArr += 1;
                        }

                        // [GameLog] 로그 추가
                        let today = new Date();
                        let hours = today.getHours(); // 시
                        let minutes = today.getMinutes();  // 분
                        let seconds = today.getSeconds();  // 초
                        let now = hours+":"+minutes+":"+seconds;
                        var gameLog = {time: now, nickname: "", targetCompany: corpName, targetSection: areaNameList[sectionIdx], detail: config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex]+" response has been completed."};
                        var logArr = [];
                        logArr.push(gameLog);
                        io.sockets.in(socket.room+'true').emit('addLog', logArr);
                        
                    } else {   // 방어 실패
                        console.log("DefenseCooltime - faile!!");
                        socket.emit('Failed to defense');
                        automaticDefense(socket, corpName, sectionIdx, tacticIndex, techniqueIndex);
                        return;
        
                        // sectionDefenseProgressArr = sectionDefenseProgressArr.filter(function(progress){
                        //     return progress.tactic != config.ATTACK_CATEGORY[tacticIndex] && progress.attackName != config.ATTACK_TECHNIQUE[techniqueIndex];
                        // });
        
                        // DefenseCooltime(socket, attackInfo.state, corpName, sectionIdx, tacticIndex, techniqueIndex, defenseLevel);
                    }
        
                    console.log("DefenseCooltime - sectionAttackProgressArr (after) : ", sectionAttackProgressArr);
                    roomTotalJson[0][corpName].sections[sectionIdx].attackProgress = sectionAttackProgressArr;
                    roomTotalJson[0][corpName].sections[sectionIdx].defenseProgress = sectionDefenseProgressArr;
                    console.log("DefenseCooltime - roomTotalJson[0][corpName].sections[sectionIdx].defenseProgress (after) : ", roomTotalJson[0][corpName].sections[sectionIdx].defenseProgress);
        
                    await jsonStore.updatejson(roomTotalJson[0], socket.room);

                } else { // 공격 실패 (성공률로 인해)
                    console.log("Failed due to success rate!!")
                    socket.emit('Failed to success rate');
                    automaticDefense(socket, corpName, sectionIdx, tacticIndex, techniqueIndex);
                    return;
                    // DefenseCooltime(socket, attackInfo.state, corpName, sectionIdx, tacticIndex, techniqueIndex, defenseLevel);
                }
            }

            clearTimeout(defenseTime);
            
        }, config["DEFENSE_" + (tacticIndex + 1)]["time"][defenseLevel] * 1000);
    }

    

        // 자동 대응 수행
        async function automaticDefense(socket, companyName, section, tacticIndex, techniqueIndex) {
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var sectionAttackProgressArr = roomTotalJson[0][companyName].sections[section].attackProgress;

            var attackInfo = sectionAttackProgressArr.filter(function(progress){
                return progress.tactic == config.ATTACK_CATEGORY[tacticIndex] && progress.attackName == config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex];
            })[0];
            
            console.log("automaticDefense - companyName : ", companyName);
            console.log("automaticDefense - section : ", section);
            console.log("automaticDefense - tacticIndex : ", tacticIndex);
            console.log("automaticDefense - techniqueIndex : ", techniqueIndex);

            let cardLv;
            let pitaNum = 0;
            if (socket.team == true) {
                console.log("white team upgrade attack card");
                cardLv = roomTotalJson[0][companyName]["penetrationTestingLV"][tacticIndex];
                if (cardLv < 5) {
                    pitaNum = roomTotalJson[0]['whiteTeam']['total_pita'] - config["DEFENSE_" + (tacticIndex + 1)]['pita'][cardLv];
                    roomTotalJson[0]['whiteTeam']['total_pita'] = pitaNum;

                    console.log("[!!!!!] pita num : ", pitaNum);
                }
            }

            if (pitaNum >= 0 && cardLv < 5) {
                socket.to(socket.room + socket.team).emit('Update Pita', pitaNum);
                socket.emit('Update Pita', pitaNum);

                let techniqueBeActivationList = roomTotalJson[0][companyName]["sections"][section]["beActivated"];
                techniqueBeActivationList.length = 0;
                
                let techniqueActivation = roomTotalJson[0][companyName]["sections"][section]["defenseActive"];
                let techniqueLevel = roomTotalJson[0][companyName]["sections"][section]["defenseLv"];

                // white team -> 공격을 선택할 수 있도록 함
                DefenseCooltime(socket, attackInfo.state, companyName, section, tacticIndex, techniqueIndex, cardLv);
                // socket.emit('Start Defense', companyName, section, tacticIndex, techniqueIndex, config["DEFENSE_" + (categoryIndex + 1)]["time"][techniqueLevel[categoryIndex][techniqueBeActivationList[i]]]);
                socket.emit('Start Defense', companyName, section, tacticIndex, techniqueIndex, config["DEFENSE_1"]["time"][techniqueLevel[categoryIndex][techniqueBeActivationList[i]]]);

                await jsonStore.updatejson(roomTotalJson[0], socket.room);
                roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            } else {
                console.log("Something Problem!!!")
                console.log("pitanum : ", pitaNum)
                console.log("cardLv : ", cardLv)
                if (pitaNum < 0){
                    console.log("업그레이드 실패!! >> pita 부족");
                    socket.emit("Short of Money");
                } else if (cardLv >= 5){
                    console.log("업그레이드 실패!! >> 만랩 달성");
                    socket.emit("Already Max Level");
                }
            }

            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        }


    // 모든 회사가 몰락인지 확인, 몰락이면 게임 종료
    async function AllAbandon(socket, roomTotalJson){
        var gameover = true;
        for(let company of companyNameList){
            if(roomTotalJson[0][company]["abandonStatus"] == false){
                gameover = false;
                break;
            }
        }
        
        var winTeam = false;
        if(gameover){
            console.log("#---------- 게임 종료됨(AllAbandon)----------#");
            clearInterval(timerId);
            clearInterval(pitaTimerId);
            io.sockets.in(socket.room).emit('Timer END'); 
            io.sockets.in(socket.room).emit('Load_ResultPage');
            socket.on('Finish_Load_ResultPage', async()=> {
                // 남은 피타
                var blackPitaNum = roomTotalJson[0]["blackTeam"]["total_pita"];
                var whitePitaNum = roomTotalJson[0]["whiteTeam"]["total_pita"];

                // 화이트팀 : (남은 회사 * 1000) + 남은 피타    // 블랙팀 : (파괴한 회사 * 1000) + 남은 피타
                var whiteScore = whitePitaNum;
                var blackScore = (5 * 1000) + blackPitaNum;

                if(whiteScore > blackScore){
                    winTeam = true;
                } else if (whiteScore < blackScore){
                    winTeam = false;
                } else {
                    // 무승부
                    winTeam = null;
                }
                io.sockets.in(socket.room).emit('Abandon_Gameover', winTeam, blackScore, whiteScore);

                await SaveDeleteGameInfo(socket.room);
            });
        }
    }

    // 타임오버로 인한 게임 종료 -> 점수계산
    async function TimeOverGameOver(socket, roomTotalJson){        
       console.log("#---------- 게임 종료됨(TimeOverGameOver)----------#");
       
        // 살아남은 회사수
        var aliveCnt = 0;
        for(let company of companyNameList){
            if(roomTotalJson[0][company]["abandonStatus"] == false){
                aliveCnt++;
            }
        }

        // 남은 피타
        var blackPitaNum = roomTotalJson[0]["blackTeam"]["total_pita"];
        var whitePitaNum = roomTotalJson[0]["whiteTeam"]["total_pita"];


        // 화이트팀 : (남은 회사 * 1000) + 남은 피타    // 블랙팀 : (파괴한 회사 * 1000) + 남은 피타
        var whiteScore = (aliveCnt * 1000) + whitePitaNum;
        var blackScore = ((5-aliveCnt) * 1000) + blackPitaNum;

        var winTeam = null;
        if(whiteScore > blackScore){
            winTeam = true;
        } else if (whiteScore < blackScore){
            winTeam = false;
        } else {
            // 무승부
            winTeam = null;
        }

        io.sockets.in(socket.room).emit('Timeout_Gameover', winTeam, blackScore, whiteScore);

        await SaveDeleteGameInfo(socket.room);
    }   

  // 게임 종료시 게임 정보와 룸 정보를 mongoDB에 저장 후 redis에서 삭제
  async function SaveDeleteGameInfo(roomPin){        
    // 게임 정보 저장 (mongoDB)
    var gameTotalJson = JSON.parse(await jsonStore.getjson(roomPin));
    var gameTotalScm = new RoomTotalSchema(gameTotalJson[0]);
    func.InsertGameRoomTotal(gameTotalScm);


    // 룸 정보 저장 (mongoDB)
    // 해당 룸의 모든 사용자 정보 가져와 new user 정보 추가 후 update
    var roomMembersList =  await redis_room.RoomMembers(roomPin);
    var roomMembersDict = {}

    var user;
    for (const member of roomMembersList){
        // roomMembersDict[member] = await redis_room.getMember(room, member);
        user = await redis_room.getMember(roomPin, member);

        // roomMembersDict[member] = ({
        //     new BlackUsers(
        //     userID   : user.userID,
        //     nickname : user.nickname,
        //     team : user.team,
        //     status : user.status,
        //     color : user.color,
        //     place : user.place,
        //     socketID : user.socketID,
        // });
        roomMembersDict[member] = new User(user);
    }   
    console.log('!!!~~roomMembersDict', roomMembersDict);

    // roomInfo 정보
    var roomInfo = JSON.parse(await redis_room.getRoomInfo(roomPin));
    console.log('!!!~~roomInfo', roomInfo);
    var roomInfoScm = new RoomInfo(roomInfo);
    console.log('!!!~~roomInfoScm', roomInfoScm);

    // 합치기 
    var roomTotalScm = new RoomInfoTotal({
        Users :roomMembersDict, 
        Info : roomInfoScm
    });
    func.InsertRoomInfoTotal(roomTotalScm);

    // 게임 정보 삭제 (redis)
    await jsonStore.deletejson(roomPin);

     // 룸 정보 삭제 (redis)
    redis_room.deleteRooms(roomPin); 
  }
    
}

