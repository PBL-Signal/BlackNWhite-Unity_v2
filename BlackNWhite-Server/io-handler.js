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
    let sectionNames = [["Area_DMZ", "Area_Interal", "Area_Sec"], ["Area_DMZ", "Area_Interal", "Area_Sec"],["Area_DMZ", "Area_Interal", "Area_Sec"],["Area_DMZ", "Area_Interal", "Area_Sec"],["Area_DMZ", "Area_Interal", "Area_Sec"]];
    let vulnArray = ["Reconnaissance", "Credential Access", "Discovery", "Collection"];      
    let attack_name_list = ["Reconnaissance", "Credential Access", "Discovery", "Collection", "Resource Development", "Initial Access", "Execution", "Privilege Escalation", "Persistence", "Defense Evasion", "Command and Control", "Exfiltration", "Impact"];      

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

            // Timer 시작
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
        


        // 무력화 test (나중에 삭제해야됨)
        socket.on('TestNeutralization', async function() {
            console.log("[On] TestNeutralization 스키마에 경고 추가 및 isBlocked True");
            // console.log("[Emit] OnNeutralization");

            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            // 회사 A, C 에 경고 3번으로 무력화 true
            roomTotalJson[0].blackTeam.users[socket.userID].companyA.warnCnt = 3;
            roomTotalJson[0].blackTeam.users[socket.userID].companyA.IsBlocked = true;

            roomTotalJson[0].blackTeam.users[socket.userID].companyC.warnCnt = 3;
            roomTotalJson[0].blackTeam.users[socket.userID].companyC.IsBlocked = true;


            // console.log("[CHECK] roomTotalJson[0].blackTeam.users[socket.userID] : ", roomTotalJson[0].blackTeam.users[socket.userID]);
            await jsonStore.updatejson(roomTotalJson[0], socket.room);

            socket.emit('OnNeutralization', true);            
        });

        // 특정 회사가 무력화인지 확인
        socket.on('Check Neutralization',  async function(company) {
            console.log("[On] Check Neutralization ", company);

            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            // 회사 isBlocked 정보 가져옴
            var companyIsBlocked = roomTotalJson[0].blackTeam.users[socket.userID][company].IsBlocked;
            console.log("!-- companyIsBlocked : ", companyIsBlocked);
            
            // null 처리
            if (!companyIsBlocked){
                companyIsBlocked = false;
                console.log("!-- companyIsBlocked NULL처리 : ", companyIsBlocked);
            }
            
            socket.emit('OnNeutralization', companyIsBlocked);
        });


        // 무력화 해결 시도 시
        socket.on('Try Non-neutralization', async(company)=> {
            console.log("[On] Solve Neutralization company :", company);
          
            //  json 불러와서 해당 영역 회사 경고 초기화 함 
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("JSN!!!",roomTotalJson[0]);
            
            var black_total_pita = roomTotalJson[0].blackTeam.total_pita;
            console.log("blackTeam.total_pita!!!", black_total_pita );

            
            // 무력화 상태인지 확인
            var companyIsBlocked = roomTotalJson[0].blackTeam.users[socket.userID][company].IsBlocked;
            console.log("!-- companyIsBlocked : ", companyIsBlocked);

            roomTotalJson[0].blackTeam.total_pita = parseInt(roomTotalJson[0].blackTeam.total_pita) - parseInt(config.UNBLOCK_INFO.pita);
            console.log("roomTotalJson[0].blackTeam.total_pita!!", roomTotalJson[0].blackTeam.total_pita);
            
            if (!companyIsBlocked)
            {
                console.log("무력화 상태 아님!");
                socket.emit('After non-Neutralization', false);
                
                gameLogger.info("game:neutralization_attempt", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userId,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : socket.roomID,
                        team : socket.team,
                        companyName : company,
                        IsBlocked: roomTotalJson[0].blackTeam.users[socket.userID][company].IsBlocked,
                        state : 0,
                        cost :0,
                        totalPita : black_total_pita
                    },
                });
                return 
            }
        
            // 가격화 
            if (parseInt(black_total_pita) - parseInt(config.UNBLOCK_INFO.pita) < 0){
                console.log("무력화 해제 실패!");
                socket.emit('After non-Neutralization', false);
                gameLogger.info("game:neutralization_attempt", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userId,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : socket.roomID,
                        team : socket.team,
                        companyName : company,
                        IsBlocked: roomTotalJson[0].blackTeam.users[socket.userID][company].IsBlocked,
                        state : -1,
                        cost :0,
                        totalPita : black_total_pita
                    },
                });
                return 
            }
        
  
            // pita 가격 마이너스
            roomTotalJson[0].blackTeam.total_pita = parseInt(roomTotalJson[0].blackTeam.total_pita) - parseInt(config.UNBLOCK_INFO.pita);
            
            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            io.sockets.in(socket.room+'false').emit('Update Pita', roomTotalJson[0].blackTeam.total_pita );
            socket.emit('After non-Neutralization', true);

            gameLogger.info("game:neutralization_attempt", {
                server : 'server1',
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userID,
                nickname : socket.nickname,
                data : 	{
                    roomID : socket.roomID,
                    team : socket.team,
                    companyName : company,
                    IsBlocked: roomTotalJson[0].blackTeam.users[socket.userID][company].IsBlocked,
                    state : 1,
                    cost : config.UNBLOCK_INFO.pita,
                    totalPita :roomTotalJson[0].blackTeam.total_pita 
                },
            });
            
            
            setTimeout(async function(){
                //  json 불러와서 해당 영역 회사 경고 초기화 함 
                roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                // console.log("[setTimeout] JSON!!!",roomTotalJson);

                // isBlocked 해제
                roomTotalJson[0].blackTeam.users[socket.userID][company].IsBlocked = false;
                await jsonStore.updatejson(roomTotalJson[0], socket.room);

                console.log("무력화 해제 성공!");

                // [GameLog] 로그 추가 - 무력화 해제 로그
                const blackLogJson = JSON.parse(await jsonStore.getjson(socket.room+":blackLog"));

                let today = new Date();   
                let hours = today.getHours(); // 시
                let minutes = today.getMinutes();  // 분
                let seconds = today.getSeconds();  // 초
                let now = hours+":"+minutes+":"+seconds;
                var monitoringLog = {time: now, nickname: socket.nickname, targetCompany: company, targetSection: "", actionType: "Neutralization", detail: socket.nickname+"무력화 해제되었습니다."};

                blackLogJson[0].push(monitoringLog);
                await jsonStore.updatejson(blackLogJson[0], socket.room+":blackLog");

                var logArr = [];
                logArr.push(monitoringLog);
                // socket.emit('BlackLog', logArr);
                // socket.to(socket.room).emit('BlackLog', logArr);
                io.sockets.in(socket.room+'false').emit('addLog', logArr);
                console.log("무력화 해제 성공!");          

                gameLogger.info("game:neutralization_success", {
                server : 'server1',
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userID,
                nickname : socket.nickname,
                data : 	{
                    roomID : socket.roomID,
                    team : socket.team,
                    companyName : company,
                    IsBlocked: roomTotalJson[0].blackTeam.users[socket.userID][company].IsBlocked,
                    state : 1,
                    cost : config.UNBLOCK_INFO.pita,
                    totalPita :roomTotalJson[0].blackTeam.total_pita 
                },
            });          
            }, 10000); // 10초

            
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            let company_blockedNum = 0;

            for (var userId in roomTotalJson[0]["blackTeam"]["users"]){
                console.log("[On Monitoring] user id : ", userId);
                if (roomTotalJson[0]["blackTeam"]["users"][userId][company]["IsBlocked"] == true){
                    company_blockedNum += 1;
                }
            }

            console.log("[On Monitoring] company_blockedNum : ", company_blockedNum);
        
            socket.to(socket.room+'true').emit("Blocked Num", company_blockedNum);
            socket.emit('Blocked Num', company_blockedNum);
        
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
                    console.log("[socketon - Section Activation Check] roomTotalJson[0][companyName]['sections'][i]['activation'] : ", roomTotalJson[0][companyName]["sections"][i]["responsible"]);
                    activationList.push(roomTotalJson[0][companyName]["sections"][i]["responsible"]);
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


        // 게임 카드 리스트 보내기
        socket.on("Load Card List", async(teamData) => {            
            let teamDataJson = JSON.parse(teamData);

            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("Load card list teamData : ", teamDataJson);
            let returnArray;

            if (socket.team == true) {
                returnArray = roomTotalJson[0][teamDataJson.companyName]["penetrationTestingLV"];
                console.log("load card list return value : ", returnArray);
            } else {
                returnArray = roomTotalJson[0][teamDataJson.companyName]["attackLV"];
                console.log("load card list return value : ", returnArray);
            }

            socket.to(socket.room + socket.team).emit("Card List", teamDataJson.companyName, returnArray);
            socket.emit("Card List", teamDataJson.companyName, returnArray);
        });

        // 게임 카드 리스트 보내기
        socket.on("Load Attack Step", async(teamData) => {            
            let teamDataJson = JSON.parse(teamData);

            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("Load card list teamData : ", teamDataJson);

            if (socket.team == true){  // white 팀 response step
                console.log("Load Attack Step - sectino", roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]);
                console.log("load response list : ", roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]["response"]["progress"]);
                console.log("load response step : ", roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]["responseStep"]);

                let responseProgress = []
                for(var i in roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]["response"]["progress"]){
                    console.log("responseIndex : ", roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]["response"]["progress"][i]);
                    responseProgress.push(Number(Object.keys(roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]["response"]["progress"][i])));
                }

                console.log("responseProgress : ", responseProgress)

                socket.to(socket.room+'true').emit("Load Response List", teamDataJson.companyName, teamDataJson.sectionIndex, responseProgress, roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]["responseStep"] - 1);
                socket.emit("Load Response List", teamDataJson.companyName, teamDataJson.sectionIndex, responseProgress, roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]["responseStep"] - 1);

                // socket.to(socket.room+'true').emit("Response Step", roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]["responseStep"] - 1);
                // socket.emit("Response Step", roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]["responseStep"] - 1);
            } else {  // black 팀 attack step
                let step = roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]["attackStep"];
                console.log("roomTotalJson[0][teamDataJson.companyName]['sections'][teamDataJson.sectionIndex]", roomTotalJson[0][teamDataJson.companyName]["sections"][teamDataJson.sectionIndex]);

                console.log("load attack step : ", step);

                socket.to(socket.room+'false').emit("Attack Step", teamDataJson.companyName, teamDataJson.sectionIndex, step);
                socket.emit("Attack Step", teamDataJson.companyName, teamDataJson.sectionIndex, step);
            }
        });

        // 공격을 수행하였을 때 결과 처리 및 total pita 정보 보내기
        socket.on("Click Attack", async(attackData) => {
            console.log("Click Attack jsonStr : ", attackData);
            let attackJson = JSON.parse(attackData);

            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("White Team Response list inProgress (before) : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["inProgress"]);
            console.log("White Team Response list progress (before) : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"]);
            console.log("Black Team Attack list inProgress (before) : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"]);
            console.log("Black Team Attack list progress (before) : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"]);
            console.log("Click Response attackJson : ", attackJson);
            console.log("attack step load json : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attackStep"]);

            // buff가 있는지 확인한 후 쿨타임 클라이언트에게 보내기
            let cardLv = roomTotalJson[0][attackJson.companyName]["attackLV"][attackJson.attackIndex];
            console.log("[click attack] cardLv", cardLv);

            // 공격 시도 로그
            gameLogger.info("game:attack attempt", {
                server : 'server1',
                userIP : '192.0.0.1',
                sessionID : socket.sessionID,
                userID : socket.userId,
                nickname : socket.nickname,
                data : 	{
                    roomID : "sdfsdfb124gvv",
                    team : socket.team,
                    companyName : attackJson.companyName,
                    section : attackJson.sectionIndex,
                    state : "attempnt",
                    attackType : attackJson.attackIndex,
                    attackLevel : cardLv,
                    cost : config["ATTACK_" + (attackJson.attackIndex + 1)]['pita'][cardLv - 1],
                    totalPita : roomTotalJson[0]['whiteTeam']['total_pita'] - config["ATTACK_" + (attackJson.attackIndex + 1)]['pita'][cardLv - 1]
                },
            });

            if (roomTotalJson[0]['whiteTeam']['total_pita'] - config["ATTACK_" + (attackJson.attackIndex + 1)]['pita'][cardLv - 1] >= 0){
                let pitaNum = roomTotalJson[0]['whiteTeam']['total_pita'] - config["ATTACK_" + (attackJson.attackIndex + 1)]['pita'][cardLv - 1];
                roomTotalJson[0]['whiteTeam']['total_pita'] = pitaNum;

                socket.to(socket.room + socket.team).emit('Update Pita', pitaNum);
                socket.emit('Update Pita', pitaNum);

                var attackList = roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"];
                var attackInProgressList = roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"];
                var existAttack = false;
                var buff = 0;
                // 성공한 공격 중 찾기 (수행 여부, buf 여부 및 개수)
                for(var i = 0; i < attackList.length; i++){ 
                    console.log("공격 수행 여부 attackList[i] : ", attackList[i]);
                    if (Object.keys(attackList[i]) == attackJson.attackIndex) { 
                        existAttack = true;
                    }

                    // 8 ~ 10 사이의 공격이 선행된 경우 버프를 받아 공격 성공의 1초씩 감소함
                    if (8 <= Object.keys(attackList[i]) && Object.keys(attackList[i]) <= 10){
                        buff += 1;
                    }
                }

                // 시도 중인 공격 중 찾기 (수행 여부)
                for(var i = 0; i < attackInProgressList.length; i++){ 
                    console.log("공격 수행 여부 attackInProgressList[i] : ", attackInProgressList[i]);
                    if (Object.keys(attackInProgressList[i]) == attackJson.attackIndex) { 
                        existAttack = true;
                    }
                }

                console.log("buff num : ", buff)

                console.log("공격 수행 여부 : ", existAttack);

                var cooltime = config["ATTACK_" + (attackJson.attackIndex + 1)]["time"][cardLv - 1];
                if (buff > 0 && (11 <= attackJson.attackIndex && attackJson.attackIndex <= 12)) {
                    console.log("버프 발생! >> buff : ", buff, "초 감소");
                    cooltime -= buff;
                }

                console.log("continue Event - cooltime: ", cooltime);

                socket.emit("Continue Event", cooltime);

                let step = -1;
                // 만약 1단계 공격이라면 그에 맞는 공격만 효과가 있음
                if (0 <= attackJson.attackIndex && attackJson.attackIndex < 4){
                    if (attackJson.attackIndex == roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["vuln"]){
                        console.log("attack success : ", attackJson.attackIndex)

                        if (!existAttack){
                            let json = new Object();
                            json[attackJson.attackIndex] = socket.userID;
                            roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"].push(json);
                            console.log("[click attack] json : ", json);
                            console.log("[click attack] attack inProgress : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"]);
                            step = 1;

                            console.log("attackcount param cooltime : ", cooltime);

                            attackCount(socket, attackJson, cooltime, step);

                            // // 만약 유지보수 레벨이 0이면 관제 및 blocked에 대한 기능이 모두 수행되지 않음
                            monitoringCount(socket, attackJson);
                        } else {
                            console.log("이미 수행한 공격입니다.");
                            // // 만약 유지보수 레벨이 0이면 관제 및 blocked에 대한 기능이 모두 수행되지 않음
                            monitoringCountBlocked(socket, attackJson);
                            
                        }
                        
                    } else {
                        console.log("취약점이 아닌 공격입니다.");
                        // // 만약 유지보수 레벨이 0이면 관제 및 blocked에 대한 기능이 모두 수행되지 않음
                        monitoringCountBlocked(socket, attackJson);
                    }
                } else {
                    console.log("이미 수행된 공격인가? existAttack : ", existAttack);

                    if (!existAttack){
                        if (attackJson.attackIndex == 4){
                            step = 2;
                        } else if (attackJson.attackIndex == 5){
                            step = 3;
                        } else if (attackJson.attackIndex == 6){
                            step = 4;
                        } else if (attackJson.attackIndex == 7){
                            step = 5;
                        } else if (11 <= attackJson.attackIndex && attackJson.attackIndex <= 12){
                            step = 6;
                        }

                        let json = new Object();
                        json[attackJson.attackIndex] = socket.userID;
                        roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"].push(json);
                        console.log("[click attack] json : ", json);
                        console.log("[click attack] attack inProgress : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"]);
                
                        console.log("결정된 인덱스 별 step : ", step);

                        attackCount(socket, attackJson, cooltime, step);

                        monitoringCount(socket, attackJson);
                    } else {
                        console.log("이미 수행한 공격입니다.");

                        monitoringCountBlocked(socket, attackJson);
                    }
                    
                }
            } else {
                console.log("공격 실패! >> Pita 부족");
                socket.emit("Short of Money");

                if (attackJson.teamName == true) {
                    pitaNum = roomTotalJson[0]['whiteTeam']['total_pita'] + config["ATTACK_" + (attackJson.attackIndex + 1)]['pita'][cardLv - 1];
                    roomTotalJson[0]['whiteTeam']['total_pita'] = pitaNum;
    
                    console.log("[!!!!!] pita num : ", pitaNum);
    
                } else {
                    pitaNum = roomTotalJson[0]['blackTeam']['total_pita'] + config["ATTACK_" + (attackJson.attackIndex + 1)]['pita'][cardLv - 1];
                    roomTotalJson[0]['blackTeam']['total_pita'] = pitaNum;
    
                    console.log("[!!!!!] pita num : ", pitaNum);
                }

                // 공격 실패 - 피타 부족
                gameLogger.info("game:attack fail", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userId,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : "sdfsdfb124gvv",
                        team : socket.team,
                        companyName : attackJson.companyName,
                        section : attackJson.sectionIndex,
                        state : "fail",
                        cause : "pita",
                        attackType : attackJson.attackIndex,
                        attackLevel : cardLv,
                        cost : 0,
                        totalPita : pitaNum
                    },
                });
            }

            // step = roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attackStep"];
            console.log("roomTotalJson[0][attackJson.companyName]['sections'][attackJson.sectionIndex] : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]);
            // console.log("attack step update : ", step);
            

            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("attack step after update json : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attackStep"]);
            console.log("attack step after destroy status json : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["destroyStatus"]);
        });

        // 공격을 수행하였을 때 결과 처리 및 total pita 정보 보내기
        socket.on("Click Response", async(responseData) => {
            console.log("Click Attack jsonStr : ", responseData);
            let responseJson = JSON.parse(responseData);

            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("White Team Response list inProgress (Click Response before) : ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["inProgress"]);
            console.log("White Team Response list progress (Click Response before) : ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["progress"]);
            console.log("Black Team Attack list inProgress (Click Response before) : ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attack"]["inProgress"]);
            console.log("Black Team Attack list progress (Click Response before) : ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attack"]["progress"]);
            console.log("Click Response responseJson : ", responseJson);
            console.log("response step load json : ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["responseStep"]);

            let cardLv = roomTotalJson[0][responseJson.companyName]["penetrationTestingLV"][responseJson.attackIndex];

            // pita 감소
            let pitaNum;
            // 공격 시도 성공
            if (roomTotalJson[0]['blackTeam']['total_pita'] - config["RESPONSE_" + (responseJson.attackIndex + 1)]['pita'][cardLv - 1] >= 0){

                pitaNum = roomTotalJson[0]['blackTeam']['total_pita'] - config["RESPONSE_" + (responseJson.attackIndex + 1)]['pita'][cardLv - 1];
                roomTotalJson[0]['blackTeam']['total_pita'] = pitaNum;
                console.log("[!!!!!] pita num : ", pitaNum);
                
                socket.to(socket.room + socket.team).emit('Update Pita', pitaNum);
                socket.emit('Update Pita', pitaNum);                

                let indexStep = 0;
                if (0 <= responseJson.attackIndex && responseJson.attackIndex <= 3){
                    indexStep = 1;
                } else if (responseJson.attackIndex == 4){
                    indexStep = 2;
                } else if (responseJson.attackIndex == 5){
                    indexStep = 3;
                } else if (responseJson.attackIndex == 6){
                    indexStep = 4;
                } else if (responseJson.attackIndex == 7){
                    indexStep = 5;
                }  else if (11 <= responseJson.attackIndex && responseJson.attackIndex <= 12){
                    indexStep = 6;
                }

                // 시도 중인 공격 중 찾기 (수행 여부)
                const attackList = [
                    ...roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attack"]["inProgress"],
                    ...roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attack"]["progress"]
                ]
                for(var i = 0; i < attackList.length; i++){ 
                    if (Object.keys(attackList[i]) == responseJson.attackIndex) { 
                        console.log("[click response] 공격 수행 여부 & 화이트 inPorgress에 추가 attackList[i] : ", attackList[i]);
                        roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["inProgress"].push(attackList[i]);
                        break;
                    }
                }

                console.log("White Team Response list inProgress (add attack index) : ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["inProgress"]);


                var cooltimeLV;
                if (cardLv > roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["level"]){
                    console.log("특정 영역 보안 레벨이 대응 레벨보다 낮음 >> 특정 영역 보안 레벨로 쿨타임 적용");
                    cooltimeLV = roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["level"];
                } else {
                    console.log("특정 영역 보안 레벨이 대응 레벨과 같거나 낮음 >> 대응의 레벨로 쿨타임 적용");
                    cooltimeLV = cardLv;
                }

                socket.emit("Continue Event", config["RESPONSE_" + (responseJson.attackIndex + 1)]['time'][cooltimeLV - 1]);

                console.log("[Click Response] cooltimeLV", cooltimeLV);
                responseCount(socket, responseJson, indexStep, (cooltimeLV - 1));

                // 대응 시도
                gameLogger.info("game:response attempt", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userId,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : "sdfsdfb124gvv",
                        team : socket.team,
                        companyName : responseJson.companyName,
                        section : responseJson.sectionIndex,
                        state : "attempt",
                        responseType : responseJson.attackIndex,
                        responseLevel : cardLv,
                        sectionLevel : roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["level"],
                        cost : config["RESPONSE_" + (responseJson.attackIndex + 1)]['pita'][cardLv - 1],
                        totalPita : pitaNum
                    },
                });
            } else {
                console.log("방어 실패!! >> pita 부족")
                socket.emit("Short of Money");

                // 대응 실패 - pita 부족
                gameLogger.info("game:response fail", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userId,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : "sdfsdfb124gvv",
                        team : socket.team,
                        companyName : responseJson.companyName,
                        section : responseJson.sectionIndex,
                        state : "fail",
                        cause : "pita",
                        responseType : responseJson.attackIndex,
                        responseLevel : cardLv,
                        sectionLevel : roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["level"],
                        cost : 0,
                        totalPita : pitaNum
                    },
                });
            }
            
            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        });


        // 모의해킹 혹은 연구를 수행하였을 때 결과 처리 및 total pita 정보 보내기
        socket.on("Click Upgrade Attack", async(upgradeJson) => {
            let upgradeAttackInfo = JSON.parse(upgradeJson);

            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            console.log("Update card list upgradeAttackInfo : ", upgradeAttackInfo);

            let cardLv;
            let pitaNum;
            if (socket.team == true) {
                console.log("white team upgrade attack card");
                cardLv = roomTotalJson[0][upgradeAttackInfo.companyName]["penetrationTestingLV"][upgradeAttackInfo.attackIndex];
                pitaNum = roomTotalJson[0]['whiteTeam']['total_pita'] - config["RESPONSE_" + (upgradeAttackInfo.attackIndex + 1)]['pita'][cardLv];
                roomTotalJson[0]['whiteTeam']['total_pita'] = pitaNum;

                console.log("[!!!!!] pita num : ", pitaNum);
            } else {
                console.log("black team upgrade attack card");
                cardLv = roomTotalJson[0][upgradeAttackInfo.companyName]["attackLV"][upgradeAttackInfo.attackIndex];
                console.log("team total_pita : ", roomTotalJson[0]['blackTeam']['total_pita'], ", config pita : ", config["RESPONSE_" + (upgradeAttackInfo.attackIndex + 1)]['pita'][cardLv]);
                pitaNum = roomTotalJson[0]['blackTeam']['total_pita'] - config["RESPONSE_" + (upgradeAttackInfo.attackIndex + 1)]['pita'][cardLv];
                roomTotalJson[0]['blackTeam']['total_pita'] = pitaNum;

                console.log("[!!!!!] pita num : ", pitaNum);
            }

            if (pitaNum >= 0){                
                socket.to(socket.room + socket.team).emit('Update Pita', pitaNum);
                socket.emit('Update Pita', pitaNum);

                if (socket.team == true) {
                    console.log("white team upgrade attack card");
                    roomTotalJson[0][upgradeAttackInfo.companyName]["penetrationTestingLV"][upgradeAttackInfo.attackIndex] += 1;
                } else {
                    console.log("black team upgrade attack card");
                    roomTotalJson[0][upgradeAttackInfo.companyName]["attackLV"][upgradeAttackInfo.attackIndex] += 1;
                }

                console.log("Update card list roomTotalJson : ", roomTotalJson[0][upgradeAttackInfo.companyName]);

                await jsonStore.updatejson(roomTotalJson[0], socket.room);
                roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                console.log("Update card list update roomTotalJson : ", roomTotalJson);
                let returnValue;

                if (socket.team == true) {
                    returnValue = roomTotalJson[0][upgradeAttackInfo.companyName]["penetrationTestingLV"];
                } else {
                    returnValue = roomTotalJson[0][upgradeAttackInfo.companyName]["attackLV"];
                }

                // 나중에 white와 black 구분해서 보내기
                console.log("Update Card List Return Value : ", returnValue);
                socket.to(socket.room + socket.team).emit("Card List", upgradeAttackInfo.companyName, returnValue);
                socket.emit("Card List", upgradeAttackInfo.companyName, returnValue);

                if (socket.team == true){
                    // 모의해킹(대응 업그레이드) 성공 로그
                    gameLogger.info("game:penetraion testing success", {
                        server : 'server1',
                        userIP : '192.0.0.1',
                        sessionID : socket.sessionID,
                        userID : socket.userId,
                        nickname : socket.nickname,
                        data : 	{
                            roomID : "sdfsdfb124gvv",
                            team : socket.team,
                            companyName : upgradeAttackInfo.companyName,
                            section : upgradeAttackInfo.sectionIndex,
                            state : "success",
                            responseType : upgradeAttackInfo.attackIndex,
                            responseLevel : cardLv,
                            cost : config["RESPONSE_" + (upgradeAttackInfo.attackIndex + 1)]['pita'][cardLv - 1],
                            totalPita : pitaNum
                        },
                    });
                } else {
                    // 연구(공격 업그레이드) 성공 로그
                    gameLogger.info("game:research success", {
                        server : 'server1',
                        userIP : '192.0.0.1',
                        sessionID : socket.sessionID,
                        userID : socket.userId,
                        nickname : socket.nickname,
                        data : 	{
                            roomID : "sdfsdfb124gvv",
                            team : socket.team,
                            companyName : upgradeAttackInfo.companyName,
                            section : upgradeAttackInfo.sectionIndex,
                            state : "success",
                            attackType : upgradeAttackInfo.attackIndex,
                            attackLevel : cardLv,
                            cost : config["RESPONSE_" + (upgradeAttackInfo.attackIndex + 1)]['pita'][cardLv - 1],
                            totalPita : pitaNum
                        },
                    });
                }
                
            } else {
                console.log("업그레이드 실패!! >> pita 부족");
                socket.emit("Short of Money");

                if (socket.team = true){
                    // 연구(공격 업그레이드) 실패 로그
                    gameLogger.info("game:penetraion tesing fail", {
                        server : 'server1',
                        userIP : '192.0.0.1',
                        sessionID : socket.sessionID,
                        userID : socket.userId,
                        nickname : socket.nickname,
                        data : 	{
                            roomID : "sdfsdfb124gvv",
                            team : socket.team,
                            companyName : upgradeAttackInfo.companyName,
                            section : upgradeAttackInfo.sectionIndex,
                            state : "fail",
                            cause : "pita",
                            responseType : upgradeAttackInfo.attackIndex,
                            responseLevel : cardLv,
                            cost : 0,
                            totalPita : pitaNum
                        },
                    });
                } else {
                    // 연구(공격 업그레이드) 실패 로그
                    gameLogger.info("game:research fail", {
                        server : 'server1',
                        userIP : '192.0.0.1',
                        sessionID : socket.sessionID,
                        userID : socket.userId,
                        nickname : socket.nickname,
                        data : 	{
                            roomID : "sdfsdfb124gvv",
                            team : socket.team,
                            companyName : upgradeAttackInfo.companyName,
                            section : upgradeAttackInfo.sectionIndex,
                            state : "fail",
                            cause : "pita",
                            attackType : upgradeAttackInfo.attackIndex,
                            attackLevel : cardLv,
                            cost : 0,
                            totalPita : pitaNum
                        },
                    });
                }
            }
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
                    await jsonStore.updatejson(roomTotalJson[0], socket.room);

                    var area_level = sectionIdx.toString() + "-" + (roomTotalJson[0][corpName].sections[sectionIdx].level);
                    io.sockets.in(socket.room+'true').emit('New_Level', corpName, area_level.toString());
                    io.sockets.in(socket.room+'true').emit('Update Pita', newTotalPita);
                }
            }
        });




        // [SectionState] Section Destroy
        socket.on('Get_Section_Destroy_State', async(corp) => {            
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var corpName = corp;
            var sections = {sections: roomTotalJson[0][corpName].sections};
            socket.emit('Section_Destroy_State', JSON.stringify(sections));
        });

        // [SectionState] Section Attacked Name
        socket.on('Get_Section_Attacked_Name', async(corp) => {
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var corpName = corp;
            var sections = {sections: roomTotalJson[0][corpName].sections}
            socket.emit('Section_Attacked_Name', JSON.stringify(sections));
        });

        // [SectionState] 관제 issue Count
        socket.on('Get_Issue_Count', async(corp) => {            
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var corpName = corp;
            var sectionsArr = roomTotalJson[0][corpName].sections;

            var cntArr = [];
            for(i=0; i<sectionsArr.length; i++)
            {
                var sectionData = roomTotalJson[0][corpName].sections[i].response.progress.length;
                cntArr[i] = sectionData;
            }
            socket.emit('Issue_Count', cntArr);
        });

        // [Abandon] 한 회사의 모든 영역이 파괴되었는지 확인 후 몰락 여부 결정
        socket.on('is_All_Sections_Destroyed', async(corpName) => {
            console.log("[Abandon]is_All_Sections_Destroyed " + corpName);
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            
            var isAbondon = true;
            var sectionsArr = roomTotalJson[0][corpName].sections;
            for(i=0; i<sectionsArr.length; i++)
            {
                var isDestroy = roomTotalJson[0][corpName].sections[i].destroyStatus;
                console.log("[Abandon]isDestroy " + i+isDestroy.toString());
                if(isDestroy == false){ // 한 영역이라도 false면 반복문 나감
                    isAbondon = false;
                    break;
                }
            }
            console.log("[Abandon] isAbondon " + isAbondon);

            if(isAbondon == true){ // 회사 몰락
                console.log("[Abandon] 회사몰락 " + corpName);
                roomTotalJson[0][corpName].abandonStatus = true;
                await jsonStore.updatejson(roomTotalJson[0], socket.room);

                // [GameLog] 로그 추가
                const blackLogJson = JSON.parse(await jsonStore.getjson(socket.room+":blackLog"));
                const whiteLogJson = JSON.parse(await jsonStore.getjson(socket.room+":whiteLog"));

                let today = new Date();   
                let hours = today.getHours(); // 시
                let minutes = today.getMinutes();  // 분
                let seconds = today.getSeconds();  // 초
                let now = hours+":"+minutes+":"+seconds;
                var monitoringLog = {time: now, nickname: "", targetCompany: corpName, targetSection: "", actionType: "Damage", detail: corpName+"회사가 파괴되었습니다"};

                blackLogJson[0].push(monitoringLog);
                whiteLogJson[0].push(monitoringLog);
                await jsonStore.updatejson(blackLogJson[0], socket.room+":blackLog");
                await jsonStore.updatejson(whiteLogJson[0], socket.room+":whiteLog");

                var logArr = [];
                logArr.push(monitoringLog);
                io.sockets.in(socket.room+'false').emit('addLog', logArr);
                io.sockets.in(socket.room+'true').emit('addLog', logArr);

                // 회사 아이콘 색상 변경
                let abandonStatusList = [];
                for(let company of companyNameList){
                    abandonStatusList.push(roomTotalJson[0][company]["abandonStatus"]);
                }
                
                console.log("Section Destroy -> abandonStatusList : ", abandonStatusList);

                io.sockets.in(socket.room).emit('Company Status', abandonStatusList);  // 블랙, 화이트 두 팀 모두에게 보냄
                // io.sockets.in(socket.room).emit('Company Status', abandonStatusList);


                // 모든 회사가 몰락인지 확인
                AllAbandon(socket, roomTotalJson);

                gameLogger.info("game:destroy company", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userId,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : "sdfsdfb124gvv",
                        companyName : corpName
                    },
                });

            }
            
        });

        // [Monitoring] monitoringLog 스키마 데이터 보내기
        socket.on('Get_MonitoringLog', async(corp) => {
            const monitoringLogJson = JSON.parse(await jsonStore.getjson(socket.room+":whiteLog"));

            var jsonArray = [];
            for (var i=0; i<monitoringLogJson[0].length; i++) {
                if(monitoringLogJson[0][i]["targetCompany"] == corp){
                    var newResult = {
                        time : monitoringLogJson[0][i]["time"],
                        nickname : monitoringLogJson[0][i]["nickname"],
                        targetCompany : corp,
                        targetSection : monitoringLogJson[0][i]["targetSection"],
                        actionType : monitoringLogJson[0][i]["actionType"],
                        detail : monitoringLogJson[0][i]["detail"]
                    }
                    jsonArray.push(newResult);
                } 
            }
            socket.emit('MonitoringLog', jsonArray);
        });


        // [Result] 최종 결과 보내기
        socket.on('Get_Final_RoomTotal', async() => {
            io.sockets.in(socket.room).emit('Timer END'); // 타이머 종료
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

            socket.emit('playerInfo', blackUsersInfo, whiteUsersInfo, JSON.stringify(finalRoomTotal)); // 플리이어 정보(닉네임, 프로필 색) 배열, 양팀 피타, 호두, 승리팀 정보 전송
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
    
        var progress = new Progress({
            progress  : [],
            inProgress  : [],
            last  : -1
        })

        var initCompanyArray = []
        for (var i = 0; i < 5; i++){
            var initCompany = new Company({
                abandonStatus : false,
                penetrationTestingLV : [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14개 
                attackLV : [0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // 유형레벨 14가지
                sections : [
                    new Section({
                        attackable : true,
                        responsible : true,
                        destroyStatus : false ,
                        level  : 1,
                        suspicionCount : 0,
                        attackStep  : 0,  
                        attackStep : 0,
                        responseStep : 0,
                        attack : progress,
                        response : progress,
                        responseLv : [], // 방어 레벨 
                        resposnseCnt : [] // 방어 횟수 
                    }),
    
                    new Section({
                        attackable : true,
                        responsible : true,
                        destroyStatus : false ,
                        level  : 1,
                        suspicionCount : 0,
                        attackStep  : 0,  
                        attackStep : 0,
                        responseStep : 0,
                        attack : progress,
                        response : progress,
                        responseLv : [], // 방어 레벨 
                        resposnseCnt : [] // 방어 횟수 
                    }),
    
                    new Section({
                        attackable : true,
                        responsible : true,
                        destroyStatus : false ,
                        level  : 1,
                        suspicionCount : 0,
                        attackStep  : 0,  
                        attackStep : 0,
                        responseStep : 0,
                        attack : progress,
                        response : progress,
                        responseLv : [], // 방어 레벨 
                        resposnseCnt : [] // 방어 횟수 
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
                users : blackUsers
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

    

    // 공격 별 n초 후 공격 성공
    async function attackCount(socket, attackJson, cooltime, step){
        console.log("attackCount cooltime : ", cooltime);

        var attackStepTime = setTimeout(async function(){
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            let invalidity = true;
            let attackInProgressList = roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"];
            let responseInProgressList = roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["inProgress"];

            console.log("[attackCount] attackInProgressList : ", attackInProgressList);

            
            // 해당 공격이 in attack prgress에 있는지 확인, 있어야 공격 성공이 가능함
            var attackData;
            for(var i = 0; i < attackInProgressList.length; i++){ 
                if (Object.keys(attackInProgressList[i]) == attackJson.attackIndex) { 
                    console.log("[attackCount] 공격 중인 리스트에 존재함 : ", i);
                    attackData = attackInProgressList[i];
                    attackInProgressList.splice(i, 1);
                    roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"] = attackInProgressList;
                    console.log("[attackCount] attackData : ", attackData);
                    console.log("[attackCount] 공격 성공 : ", attackInProgressList);
                    invalidity = false;
                }
            }
            
            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            if (!invalidity){
                // 대응 무효화 시키기
                console.log("attackCount - step : ", step);
                console.log("attackCount - attackInProgressList : ", attackInProgressList);
                console.log("attackCount - responseInProgressList : ", responseInProgressList);
                
                let responseInProgress = []
                for(var i = 0; i < responseInProgressList.length; i++){ 
                    console.log("attackIndex : ", responseInProgressList[i]);
                    responseInProgress.push(Number(Object.keys(responseInProgressList[i])));
                }

                let maxAttack = Math.max(...responseInProgress);
                let responseStep = 0;
                if (0 <= maxAttack && maxAttack < 4){
                    responseStep = 1;
                } else if (maxAttack == 4){
                    responseStep = 2;
                } else if (maxAttack == 5){
                    responseStep = 3;
                } else if (maxAttack == 6){
                    responseStep = 4;
                } else if (maxAttack == 7){
                    responseStep = 5;
                } else if (11 <= maxAttack && maxAttack <= 12){
                    responseStep = 6;
                }

                console.log("[attackCount] response step : ", responseStep);
                console.log("[attackCount] attack step : ", step);
                
                // 만약 현재 공격이 in response prgress에 있으면 해당 삭제하기
                for(var i = 0; i < responseInProgressList.length; i++){ 
                    if (Object.keys(responseInProgressList[i]) == attackJson.attackIndex || (responseStep + 1) == step) { 
                        console.log("[attackCount] 공격이 먼저 성공함, Delete Response attack in Response List : ", i);
                        responseInProgressList.splice(i, 1);
                        roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["inProgress"] = responseInProgressList;
                        break;
                    }
                }

                // 성공 시 last 수정 -> 적절한 위치 찾기
                roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["last"] = attackJson.attackIndex;
                roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"].push(attackData);
                console.log("[attackCount - !invalidity] attack inProgress", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"])
                console.log("[attackCount - !invalidity] attack progress", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"])
            
                roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attackStep"] = step;
                roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["responseStep"] = step;

                await jsonStore.updatejson(roomTotalJson[0], socket.room);
                roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

                // 첫 번째 공격 시 그 전 섹션의 대응 비활성화
                if ((step == 1) && attackJson.sectionIndex > 0){
                    console.log("[attackCount] 첫 번째 공격으로 이전 섹션 비활성화! step : ", step, ", attackJson.sectionIndex : ", attackJson.sectionIndex);
                    roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex - 1]["responsible"] = false;
    
                    var activationList = [];
                    for (let i = 0; i < roomTotalJson[0][attackJson.companyName]["sections"].length; i++){
                        console.log("[attackCount - Section Activation Check] roomTotalJson[0][companyName]['sections'][i] : ", roomTotalJson[0][attackJson.companyName]["sections"][i]);
                        console.log("[attackCount - Section Activation Check] roomTotalJson[0][companyName]['sections'][i]['responsible'] : ", roomTotalJson[0][attackJson.companyName]["sections"][i]["responsible"]);
                        activationList.push(roomTotalJson[0][attackJson.companyName]["sections"][i]["responsible"]);
                    }
    
                    console.log("[Section Activation List] activationList : ", activationList);
    
                    socket.to(socket.room+'true').emit("Section Activation List", attackJson.companyName, activationList);
                }
    
                socket.to(socket.room+'false').emit("Attack Step", attackJson.companyName, attackJson.sectionIndex, step);
                socket.emit("Attack Step", attackJson.companyName, attackJson.sectionIndex, step);
                console.log("attackCount CALLED");
    
                // [GameLog] 로그 추가 - 공격 성공 로그
                const blackLogJson = JSON.parse(await jsonStore.getjson(socket.room+":blackLog"));
    
                let today = new Date();   
                let hours = today.getHours();  // 시
                let minutes = today.getMinutes();  // 분
                let seconds = today.getSeconds();  // 초
                let now = hours+":"+minutes+":"+seconds;
                var companyIdx =  attackJson.companyName.charCodeAt(7) - 65;
                var monitoringLog = {time: now, nickname: socket.nickname, targetCompany: attackJson.companyName, targetSection: sectionNames[companyIdx][attackJson.sectionIndex], actionType: "Attack", detail: attack_name_list[attackJson.attackIndex]+"공격이 수행되었습니다."};
    
                blackLogJson[0].push(monitoringLog);
                await jsonStore.updatejson(blackLogJson[0], socket.room+":blackLog");
    
                var logArr = [];
                logArr.push(monitoringLog);
                io.sockets.in(socket.room+'false').emit('addLog', logArr);
    
                // let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                console.log("[attackcount - before setTimeout] White Team Response list : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"]);
                console.log("[attackcount - before setTimeout] Black Team Attack list : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"]);
    
                if (step == 6) {
                    roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["destroyStatus"] = true;
                    await jsonStore.updatejson(roomTotalJson[0], socket.room);
                    roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room)); 
                    console.log("destory section!! section : ", attackJson.sectionIndex, ", destroyStatus : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["destroyStatus"]); 
    
                    sectionDestroy = {company : attackJson.companyName, section : attackJson.sectionIndex};
                    var destroyJson = JSON.stringify(sectionDestroy);
    
                    io.sockets.in(socket.room+'false').emit('Section Destroy', destroyJson);
                    io.sockets.in(socket.room+'false').emit('is_All_Sections_Destroyed_Nickname', socket.nickname, attackJson.companyName);
    
                    // [GameLog] 로그 추가 - 섹션 파괴 로그
                    const blackLogJson = JSON.parse(await jsonStore.getjson(socket.room+":blackLog"));
                    const whiteLogJson = JSON.parse(await jsonStore.getjson(socket.room+":whiteLog"));
    
                    let today = new Date();   
                    let hours = today.getHours(); // 시
                    let minutes = today.getMinutes();  // 분
                    let seconds = today.getSeconds();  // 초
                    let now = hours+":"+minutes+":"+seconds;
                    var monitoringLog = {time: now, nickname: "", targetCompany: attackJson.companyName, targetSection: sectionNames[companyIdx][attackJson.sectionIndex], actionType: "Damage", detail: "파괴되었습니다."};
    
                    blackLogJson[0].push(monitoringLog);
                    whiteLogJson[0].push(monitoringLog);
                    await jsonStore.updatejson(blackLogJson[0], socket.room+":blackLog");
                    await jsonStore.updatejson(whiteLogJson[0], socket.room+":whiteLog");
                    
                    var logArr = [];
                    logArr.push(monitoringLog);
                    socket.to(socket.room).emit('addLog', logArr);
    
                    // 영역 파괴 후 다음 영역 공격 활성화
                    if (roomTotalJson[0][attackJson.companyName]["sections"].length > (attackJson.sectionIndex + 1)){
                        console.log("[Section Destory] 영역 ", (attackJson.sectionIndex + 1), "이 오픈됨!");
                        roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex + 1]["attackable"] = true;
    
                        var activationList = [];
                        for (let i = 0; i < roomTotalJson[0][attackJson.companyName]["sections"].length; i++){
                            console.log("[attackCount2 - Section Activation Check] roomTotalJson[0][companyName]['sections'][i] : ", roomTotalJson[0][attackJson.companyName]["sections"][i]);
                            console.log("[attackCount2 - Section Activation Check] roomTotalJson[0][companyName]['sections'][i]['attackable'] : ", roomTotalJson[0][attackJson.companyName]["sections"][i]["attackable"]);
                            activationList.push(roomTotalJson[0][attackJson.companyName]["sections"][i]["attackable"]);
                        }
    
                        console.log("[Section Activation List - attackCount] activationList : ", activationList);
    
                        socket.to(socket.room+'false').emit("Section Activation List", attackJson.companyName, activationList);
                        socket.emit("Section Activation List", attackJson.companyName, activationList);
                    } else {
                        console.log("[Section Destory] 해당 회사는 몰락함");
                    }
    
                }
    
                console.log("[attackcount - after setTimeout] roomTotalJson attack step ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attackStep"]);
                console.log("[attackcount - after setTimeout] roomTotalJson attack step, step ", step);
                console.log("[attackcount - after setTimeout] White Team Response list : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"]);
                console.log("[attackcount - after setTimeout] Black Team Attack list : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"]);
    
                console.log("[attackcount - after setTimeout] attack step after edit json : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attackStep"]);
    
                // 공격 성공 로그
                gameLogger.info("game:attack success", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userId,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : "sdfsdfb124gvv",
                        team : socket.team,
                        companyName : attackJson.companyName,
                        section : attackJson.sectionIndex,
                        state : "success",
                        attackType : attackJson.attackIndex,
                        attackLevel : roomTotalJson[0][attackJson.companyName]["attackLV"][attackJson.attackIndex],
                        cost : 0,
                        totalPita : roomTotalJson[0].blackTeam.total_pita
                    },
                });
            } else {
                console.log("공격이 무효화 됨 (대응 성공으로 공격 중에서 삭제 됨")
                socket.emit('Event Invalidity', attackJson.companyName, attackJson.sectionIndex);
                console.log("[attackcount - after setTimeout invalid] roomTotalJson attack step ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attackStep"]);
                console.log("[attackcount - after setTimeout invalid] roomTotalJson attack progress ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"]);
                console.log("[attackcount - after setTimeout invalid] roomTotalJson response step ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["responseStep"]);
                console.log("[attackcount - after setTimeout invalid] roomTotalJson response progress ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"]);


                let attackStep = roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attackStep"];
                console.log("공격 무효화 attack step : ", attackStep);
                socket.to(socket.room+'false').emit("Attack Step", attackJson.companyName, attackJson.sectionIndex, attackStep);
                socket.emit("Attack Step", attackJson.companyName, attackJson.sectionIndex, attackStep);
            }
            
            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));                

            clearTimeout(attackStepTime);

        }, cooltime * 1000);
    }

    // 공격 별 n초 후 관제 리스트로 넘기기
    async function monitoringCount(socket, attackJson){
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        let invalid = false;
        
        let monitoringLevel = roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["level"];

        var monitoringTime = setTimeout(async function(){
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            // 공격 중 혹은 공격에 있는 경우 해당 공격 정보를 response progress에 추가함
            var attackList = [
                ...roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"],
                ...roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"]
            ];
            console.log("[monitoringCount] attackList : ", attackList);

            var responseList = roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"];
            var monitoringSuccess = false;
            var attacker;
            for(var i = 0; i < attackList.length; i++){ 
                if (Object.keys(attackList[i]) == attackJson.attackIndex) { 
                    console.log("[monitoringCount] 공격 관제 성공 : ", attackList[i])
                    monitoringSuccess = true
                    attacker = attackList[i][attackJson.attackIndex];
                    console.log("[monitoringCount] attacker : ", attacker);
                    console.log("[monitoringCount] attackList[i] : ", attackList[i]);
                    responseList.push(attackList[i]);
                    roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"] = responseList;
                    break;
                }
            }

            console.log("[monitoringCount] monitoring success? : ", monitoringSuccess);

            console.log("[monitoringCount] White Team Response list - progress : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"]);
            console.log("[monitoringCount] Black Team Response list - inProgress : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"]);
            console.log("[monitoringCount] Black Team Attack list : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"]);

            if (monitoringSuccess){
                // let json = new Object();
                // json[attackJson.attackIndex] = socket.userID;
                // attackList.splice(delIndex, 1); 
                // roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"].push(json);
                roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["last"] = attackJson.attackIndex;

                // 관제 성공 로그
                gameLogger.info("game:monitoring attack", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userId,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : "sdfsdfb124gvv",
                        team : socket.team,
                        companyName : attackJson.companyName,
                        section : attackJson.sectionIndex,
                        attackType : attackJson.attackIndex,
                        cost : 0,
                        totalPita : roomTotalJson[0].blackTeam.total_pita
                    },
                });

                // 나중에 1단계에서 취약점 외의 공격들도 감지할 수 있도록 수정하기
                roomTotalJson[0]["blackTeam"]["users"][attacker][attackJson.companyName]["detectCnt"][attackJson.sectionIndex] += 1;
                if (roomTotalJson[0]["blackTeam"]["users"][attacker][attackJson.companyName]["detectCnt"][attackJson.sectionIndex] == 3){
                    roomTotalJson[0]["blackTeam"]["users"][attacker][attackJson.companyName]["detectCnt"][attackJson.sectionIndex] = 0;
                    roomTotalJson[0]["blackTeam"]["users"][attacker][attackJson.companyName]["warnCnt"] += 1
                    if (roomTotalJson[0]["blackTeam"]["users"][attacker][attackJson.companyName]["warnCnt"] == 3){
                        roomTotalJson[0]["blackTeam"]["users"][attacker][attackJson.companyName]["warnCnt"] = 0;
                        roomTotalJson[0]["blackTeam"]["users"][attacker][attackJson.companyName]["IsBlocked"] = true;
                        socket.emit('OnNeutralization', true);
                        console.log("You are Blocked!!!!");

                        // 시도하던 공격 무효화
                        let attackInProgressList = roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"];
                        for(var i = 0; i < attackInProgressList.length; i++){ 
                            if (Object.keys(attackInProgressList[i]) == attackJson.attackIndex) { 
                                console.log("[monitoringCount - blocked] 공격 중인 리스트에 존재함 : ", i);
                                attackInProgressList.splice(i, 1);
                                roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"] = attackInProgressList;
                                console.log("[monitoringCount - blocked] blocked 결과 : ", attackInProgressList);
                                invalid = true;
                            }
                        }

                        // 공격자 무력화 로그
                        gameLogger.info("game:blocked black", {
                            server : 'server1',
                            userIP : '192.0.0.1',
                            sessionID : socket.sessionID,
                            userID : socket.userId,
                            nickname : socket.nickname,
                            data : 	{
                                roomID : "sdfsdfb124gvv",
                                team : socket.team,
                                companyName : attackJson.companyName,
                                section : attackJson.sectionIndex,
                                attackType : attackJson.attackIndex,
                                nickname : socket.nickname,
                                userId : socket.userId,
                                cost : 0,
                                totalPita : roomTotalJson[0].whiteTeam.total_pita
                            },
                        });

                        // [GameLog] 로그 추가 - 무력화(블랙) & 무력화 발견(화이트)로그
                        const blackLogJson = JSON.parse(await jsonStore.getjson(socket.room+":blackLog"));
                        const whiteLogJson = JSON.parse(await jsonStore.getjson(socket.room+":whiteLog"));

                        let today = new Date();   
                        let hours = today.getHours(); // 시
                        let minutes = today.getMinutes();  // 분
                        let seconds = today.getSeconds();  // 초
                        let now = hours+":"+minutes+":"+seconds;

                        //var companyIdx =  attackJson.companyName.charCodeAt(7) - 65;
                        var monitoringLogBlack = {time: now, nickname: socket.nickname, targetCompany: attackJson.companyName, targetSection: "", actionType: "Neutralization", detail: socket.nickname+"님이 공격 차단되었습니다."};
                        var monitoringLogWhite = {time: now, nickname: "", targetCompany: attackJson.companyName, targetSection: "", actionType: "Neutralization", detail: attackJson.companyName+"에서 공격 차단이 수행되었습니다."};

                        blackLogJson[0].push(monitoringLogBlack);
                        whiteLogJson[0].push(monitoringLogWhite);
                        await jsonStore.updatejson(blackLogJson[0], socket.room+":blackLog");
                        await jsonStore.updatejson(whiteLogJson[0], socket.room+":whiteLog");
                        
                        var logArr = [];
                        logArr.push(monitoringLogBlack);
                        io.sockets.in(socket.room+'false').emit('addLog', logArr);
                        logArr = [];
                        logArr.push(monitoringLogWhite);
                        io.sockets.in(socket.room+'true').emit('addLog', logArr);
                    } else {
                        // 공격자 경고 로그
                        gameLogger.info("game:warn black", {
                            server : 'server1',
                            userIP : '192.0.0.1',
                            sessionID : socket.sessionID,
                            userID : socket.userId,
                            nickname : socket.nickname,
                            data : 	{
                                roomID : "sdfsdfb124gvv",
                                team : socket.team,
                                companyName : attackJson.companyName,
                                section : attackJson.sectionIndex,
                                attackType : attackJson.attackIndex,
                                nickname : socket.nickname,
                                userId : socket.userId,
                                cost : 0,
                                totalPita : roomTotalJson[0].whiteTeam.total_pita
                            },
                        });
                    }
                } else {
                    // 공격자 탐지 로그
                    gameLogger.info("game:detect black", {
                        server : 'server1',
                        userIP : '192.0.0.1',
                        sessionID : socket.sessionID,
                        userID : socket.userId,
                        nickname : socket.nickname,
                        data : 	{
                            roomID : "sdfsdfb124gvv",
                            team : socket.team,
                            companyName : attackJson.companyName,
                            section : attackJson.sectionIndex,
                            attackType : attackJson.attackIndex,
                            nickname : socket.nickname,
                            userId : socket.userId,
                            cost : 0,
                            totalPita : roomTotalJson[0].whiteTeam.total_pita
                        },
                    });
                }

                let company_blockedNum = 0;
                for (var userId in roomTotalJson[0]["blackTeam"]["users"]){
                    console.log("[On Monitoring] user id : ", userId);

                    if (roomTotalJson[0]["blackTeam"]["users"][userId][attackJson.companyName]["IsBlocked"] == true){
                        company_blockedNum += 1;
                    }
                }
                console.log("[On Monitoring] company_blockedNum : ", company_blockedNum);
                socket.to(socket.room+'true').emit("Blocked Num", company_blockedNum);
                socket.emit('Blocked Num', company_blockedNum);

                console.log(attacker, "의 userCompanyStatus : ", roomTotalJson[0]["blackTeam"]["users"][attacker]);

                if (!invalid){
                    let responseProgress = []
                    for(var i in roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"]){
                        console.log("responseIndex : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"][i]);
                        responseProgress.push(Number(Object.keys(roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"][i])));
                    }
                    
                    console.log("responseProgress", responseProgress);
    
                    console.log("Math.max(...responseProgress) ; ", Math.max(...responseProgress));
                    let step = roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["responseStep"];
                    if (roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"].length == 0){
                        step = 0;
                    } else {
                        let maxAttack = Math.max(...responseProgress);
                        if (0 <= maxAttack && maxAttack < 4){
                            step = 1;
                        } else if (maxAttack == 4){
                            step = 2;
                        } else if (maxAttack == 5){
                            step = 3;
                        } else if (maxAttack == 6){
                            step = 4;
                        } else if (maxAttack == 7){
                            step = 5;
                        } else if (11 <= maxAttack && maxAttack <= 12){
                            step = 6;
                        }
                    }
    
                    roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attackStep"] = step;
                    roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["responseStep"] = step;
    
                    console.log("[monitoringCount] responseProgress : ", responseProgress);
    
                    socket.to(socket.room+'true').emit('Load Response List', attackJson.companyName, attackJson.sectionIndex, responseProgress, step - 1);
                    socket.emit('Load Response List', attackJson.companyName, attackJson.sectionIndex, responseProgress, step - 1);
    
                    console.log("[timeout] roomTotalJson[0][attackJson.companyName]['sections'][attackJson.sectionIndex]['attack']['progress']", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"]);
                    console.log("[timeout] roomTotalJson[0][attackJson.companyName][sections][attackJson.sectionIndex][response][progress]", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"]);
    
                } else {
                    console.log("[monitoringCount] blocked로 인해 공격이 무효화 됨");
                }

                
                // white room으로 response list 보내기 -> 해당 공격들만 활성화 시키기


                console.log("Done Monitoring atttck : ", attackJson.attackIndex);

                await jsonStore.updatejson(roomTotalJson[0], socket.room);
                roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                console.log("White Team Response list (timeout) : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["response"]["progress"]);
                console.log("Black Team Attack list (timeout) : ", roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"]);
                
            } else {
                console.log("[monitoringCount] 관제에 실패함");
            }

            // [GameLog] 로그 추가 - 관제 로그 추가
            const whiteLogJson = JSON.parse(await jsonStore.getjson(socket.room+":whiteLog"));

            let today = new Date();   
            let hours = today.getHours(); // 시
            let minutes = today.getMinutes();  // 분
            let seconds = today.getSeconds();  // 초
            let now = hours+":"+minutes+":"+seconds;
            var companyIdx =  attackJson.companyName.charCodeAt(7) - 65;
            var monitoringLog = {time: now, nickname: "", targetCompany: attackJson.companyName, targetSection: sectionNames[companyIdx][attackJson.sectionIndex], actionType: "Detected", detail: attack_name_list[attackJson.attackIndex]+"공격이 탐지 되었습니다."};

            whiteLogJson[0].push(monitoringLog);
            await jsonStore.updatejson(whiteLogJson[0], socket.room+":whiteLog");

            var logArr = [];
            logArr.push(monitoringLog);
            io.sockets.in(socket.room+'true').emit('addLog', logArr);
            
            clearTimeout(monitoringTime);

        }, config["MONITORING_" + (attackJson.attackIndex + 1)]["time"][monitoringLevel] * 1000);
    }

    // 공격은 수행하였지만 관제에서 무시되는 경우 warn만 +1
    async function monitoringCountBlocked(socket, attackJson){
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        // 나중에 +1 없애기
        let monitoringLevel = roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["level"];

        var monitoringTime = setTimeout(async function(){
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            // 나중에 1단계에서 취약점 외의 공격들도 감지할 수 있도록 수정하기
            roomTotalJson[0]["blackTeam"]["users"][socket.userID][attackJson.companyName]["detectCnt"][attackJson.sectionIndex] += 1;
            if (roomTotalJson[0]["blackTeam"]["users"][socket.userID][attackJson.companyName]["detectCnt"][attackJson.sectionIndex] == 3){
                roomTotalJson[0]["blackTeam"]["users"][socket.userID][attackJson.companyName]["detectCnt"][attackJson.sectionIndex] = 0;
                roomTotalJson[0]["blackTeam"]["users"][socket.userID][attackJson.companyName]["warnCnt"] += 1
                if (roomTotalJson[0]["blackTeam"]["users"][socket.userID][attackJson.companyName]["warnCnt"] == 3){
                    roomTotalJson[0]["blackTeam"]["users"][socket.userID][attackJson.companyName]["warnCnt"] = 0;
                    roomTotalJson[0]["blackTeam"]["users"][socket.userID][attackJson.companyName]["IsBlocked"] = true;
                    socket.emit('OnNeutralization', true);
                    console.log("You are Blocked!!!!");

                    // 공격자 무력화 로그
                    gameLogger.info("game:blocked black", {
                        server : 'server1',
                        userIP : '192.0.0.1',
                        sessionID : socket.sessionID,
                        userID : socket.userId,
                        nickname : socket.nickname,
                        data : 	{
                            roomID : "sdfsdfb124gvv",
                            team : socket.team,
                            companyName : attackJson.companyName,
                            section : attackJson.sectionIndex,
                            attackType : attackJson.attackIndex,
                            nickname : socket.nickname,
                            userId : socket.userId,
                            cost : 0,
                            totalPita : roomTotalJson[0].whiteTeam.total_pita
                        },
                    });

                    // [GameLog] 로그 추가 - 무력화(블랙) & 무력화 발견(화이트)로그
                    const blackLogJson = JSON.parse(await jsonStore.getjson(socket.room+":blackLog"));
                    const whiteLogJson = JSON.parse(await jsonStore.getjson(socket.room+":whiteLog"));

                    let today = new Date();   
                    let hours = today.getHours(); // 시
                    let minutes = today.getMinutes();  // 분
                    let seconds = today.getSeconds();  // 초
                    let now = hours+":"+minutes+":"+seconds;

                    //var companyIdx =  attackJson.companyName.charCodeAt(7) - 65;
                    var monitoringLogBlack = {time: now, nickname: socket.nickname, targetCompany: attackJson.companyName, targetSection: "", actionType: "Neutralization", detail: socket.nickname+"이 공격 차단되었습니다."};
                    var monitoringLogWhite = {time: now, nickname: "", targetCompany: attackJson.companyName, targetSection: "", actionType: "Neutralization", detail: attackJson.companyName+"에서 공격 차단이 수행되었습니다."};

                    blackLogJson[0].push(monitoringLogBlack);
                    whiteLogJson[0].push(monitoringLogWhite);
                    await jsonStore.updatejson(blackLogJson[0], socket.room+":blackLog");
                    await jsonStore.updatejson(whiteLogJson[0], socket.room+":whiteLog");
                    
                    var logArr = [];
                    logArr.push(monitoringLogBlack);
                    //socket.emit('BlackLog', logArr);
                    //socket.to(socket.room).emit('BlackLog', logArr);
                    io.sockets.in(socket.room+'false').emit('addLog', logArr);
                    logArr = [];
                    logArr.push(monitoringLogWhite);
                    //socket.emit('WhiteLog', logArr);
                    //socket.to(socket.room).emit('WhiteLog', logArr);
                    io.sockets.in(socket.room+'true').emit('addLog', logArr);
                } else {
                    // 공격자 경고 로그
                    gameLogger.info("game:warn black", {
                        server : 'server1',
                        userIP : '192.0.0.1',
                        sessionID : socket.sessionID,
                        userID : socket.userId,
                        nickname : socket.nickname,
                        data : 	{
                            roomID : "sdfsdfb124gvv",
                            team : socket.team,
                            companyName : attackJson.companyName,
                            section : attackJson.sectionIndex,
                            attackType : attackJson.attackIndex,
                            nickname : socket.nickname,
                            userId : socket.userId,
                            cost : 0,
                            totalPita : roomTotalJson[0].whiteTeam.total_pita
                        },
                    });
                }
            } else {
                // 공격자 탐지 로그
                gameLogger.info("game:detect black", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userId,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : "sdfsdfb124gvv",
                        team : socket.team,
                        companyName : attackJson.companyName,
                        section : attackJson.sectionIndex,
                        attackType : attackJson.attackIndex,
                        nickname : socket.nickname,
                        userId : socket.userId,
                        cost : 0,
                        totalPita : roomTotalJson[0].whiteTeam.total_pita
                    },
                });
            }

            let company_blockedNum = 0;
            for (var userId in roomTotalJson[0]["blackTeam"]["users"]){
                console.log("[On Monitoring] user id : ", userId);

                if (roomTotalJson[0]["blackTeam"]["users"][userId][attackJson.companyName]["IsBlocked"] == true){
                    company_blockedNum += 1;
                }
            }
            console.log("[On Monitoring] company_blockedNum : ", company_blockedNum);
            socket.to(socket.room+'true').emit("Blocked Num", company_blockedNum);
            socket.emit('Blocked Num', company_blockedNum);

            console.log(socket.userID, "의 userCompanyStatus : ", roomTotalJson[0]["blackTeam"]["users"][socket.userID]);
            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            
            clearTimeout(monitoringTime);
        }, config["MONITORING_" + (attackJson.attackIndex + 1)]["time"][monitoringLevel] * 1000);
    }

    // 대응 별 n초 후 대응 성공
    async function responseCount(socket, responseJson, step, cooltimeLv){
        var responseStepTime = setTimeout(async function(){
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            // let currentRespongseStep = step;

            // var attackList = [
            //     ...roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["inProgress"],
            //     ...roomTotalJson[0][attackJson.companyName]["sections"][attackJson.sectionIndex]["attack"]["progress"]
            // ];
            // console.log("[monitoringCount] attackList : ", attackList);

            

            // console.log("[responseCount] response step : ", step);
            // console.log("[responseCount] attack step : ", attackStep);

                       
            // 해당 공격이 in attack prgress에 있는지 확인, 있어야 공격 성공이 가능함
            var responseData;
            let responseInProgressList = roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["inProgress"];
            let invalidity = true;
            for(var i = 0; i < responseInProgressList.length; i++){ 
                if (Object.keys(responseInProgressList[i]) == responseJson.attackIndex) { 
                    console.log("[responseCount] 공격 중인 리스트에 존재함 : ", i);
                    responseData = responseInProgressList[i];
                    console.log("[responseCount] responseData : ", responseData);
                    invalidity = false;
                    responseInProgressList.splice(i, 1);
                    roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["inProgress"] = responseInProgressList;
                    break;
                }
            }

            // invalidity가 true라면 공격이 무효화됨
            if (invalidity){
                console.log("대응 무효화!! >> invalidity : ", invalidity);
                socket.emit('Event Invalidity', responseJson.companyName, responseJson.sectionIndex);

                console.log("[responseCount] roomTotalJson attack step ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attackStep"]);
                console.log("[responseCount] roomTotalJson attack progress ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attack"]["progress"]);
                console.log("[responseCount] roomTotalJson response step ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["responseStep"]);
                console.log("[responseCount] roomTotalJson response progress ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["progress"]);

                let responseProgress = roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["progress"];
                let responseStep = roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["responseStep"];

                let responseIndexList = []
                for(var i = 0; i < responseProgress.length; i++){ 
                    console.log("attackIndex : ", responseProgress[i]);
                    responseIndexList.push(Number(Object.keys(responseProgress[i])));
                }

                console.log("[responseCount - invalidity] responseIndexList", responseIndexList);
                console.log("[responseCount - invalidity] step", responseStep);

                socket.to(socket.room+'true').emit('Load Response List', responseJson.companyName, responseJson.sectionIndex, responseIndexList, responseStep);
                socket.emit('Load Response List', responseJson.companyName, responseJson.sectionIndex, responseIndexList, responseStep); 
            } else {
                // 공격 무효화 시키기
                let attackInProgressList =  roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attack"]["inProgress"];
                let attackProgress = [];
                for(var i = 0; i < attackInProgressList.length; i++){ 
                    console.log("attackIndex : ", attackInProgressList[i]);
                    attackProgress.push(Number(Object.keys(attackInProgressList[i])));
                }

                let maxAttack = Math.max(...attackProgress);
                let attackStep = 0;
                if (0 <= maxAttack && maxAttack < 4){
                    attackStep = 1;
                } else if (maxAttack == 4){
                    attackStep = 2;
                } else if (maxAttack == 5){
                    attackStep = 3;
                } else if (maxAttack == 6){
                    attackStep = 4;
                } else if (maxAttack == 7){
                    attackStep = 5;
                } else if (11 <= maxAttack && maxAttack <= 12){
                    attackStep = 6;
                }

                let responseProgress = roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["progress"];
                let responseIndexList = []
                for(var i = 0; i < responseProgress.length; i++){ 
                    console.log("attackIndex : ", responseProgress[i]);
                    responseIndexList.push(Number(Object.keys(responseProgress[i])));
                }
                
                // 만약 현재 공격이 in attack prgress에 있으면 해당 삭제하기 (공격 무효화)
                console.log("responseCount] attack step : ", attackStep);
                console.log("responseCount] step : ", step);
                for(var i = 0; i < attackInProgressList.length; i++){ 
                    if (Object.keys(attackInProgressList[i]) == responseJson.attackIndex || (step + 1) == attackStep) { 
                        console.log("[responseCount] 대응이 먼저 성공함, Delete Attack in Attack List : ", i);
                        attackInProgressList.splice(i, 1);
                        roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attack"]["inProgress"] = attackInProgressList;

                        let responseIdx = responseIndexList.indexOf(responseJson.attackIndex);
                        if (responseIdx > -1){
                            responseProgress.splice(responseIdx, 1);
                            roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["progress"] = responseProgress;
                            console.log("[responseCount] responseProgress - response splice : ", responseProgress);
                        }
                    }
                }


                // response list에서 대응 성공한 공격 삭제
                let responseList = roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["progress"];
                for(var i = 0; i < responseList.length; i++){ 
                    if (Object.keys(responseList[i]) >= responseJson.attackIndex) { 
                        console.log("[responseCount] Delete Response attack in Response List : ", i);
                        responseList.splice(i, 1);
                    }
                }
                roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["progress"] = responseList;
                console.log("[responseCount] responseList : ", responseList);

                // attack list에서 대응 성공한 공격 삭제
                let attackList = roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attack"]["progress"];
                for(var i = 0; i < attackList.length; i++){ 
                    if (Object.keys(attackList[i]) == responseJson.attackIndex) { 
                        console.log("[responseCount] Delete Response attack in Response List : ", i);
                        attackList.splice(i, 1);
                        roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["progress"] = attackList;
                        break;
                    }
                }

                let responseStep = roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["responseStep"]; // response Step

                let responseProgressList = []
                if (responseList.length == 0){
                    responseStep = 0;
                } else {
                    for(var i = 0; i < responseList.length; i++){ 
                        console.log("attackIndex : ", responseList[i]);
                        responseProgressList.push(Number(Object.keys(responseList[i])));
                    }

                    console.log("[responseCount - before Max] responseProgress", responseProgressList);

                    console.log("Math.max(...responseList) : ", Math.max(...responseProgressList));
                    maxAttack = Math.max(...responseProgressList)
                    if (0 <= maxAttack && maxAttack < 4){
                        responseStep = 1;
                    } else if (maxAttack == 4){
                        responseStep = 2;
                    } else if (maxAttack == 5){
                        responseStep = 3;
                    } else if (maxAttack == 6){
                        responseStep = 4;
                    } else if (maxAttack == 7){
                        responseStep = 5;
                    } else if (11 <= maxAttack && maxAttack <= 12){
                        responseStep = 6;
                    }
                }

                if(step<6){
                    roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["destroyStatus"] = false;
                    await jsonStore.updatejson(roomTotalJson[0], socket.room);
                    roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));  
                }

                socket.to(socket.room+'true').emit('Load Response List', responseJson.companyName, responseJson.sectionIndex, responseProgress, step - 1);
                socket.emit('Load Response List', responseJson.companyName, responseJson.sectionIndex, responseProgress, step - 1); 
                console.log("[responseCount] responseProgress : ", responseProgressList);

                console.log("[responseCount - none invalidity] responseIndexList". responseIndexList);
                console.log("[responseCount - none invalidity] step". responseStep);
                socket.to(socket.room+'true').emit('Load Response List', responseJson.companyName, responseJson.sectionIndex, responseProgressList, responseStep);
                socket.emit('Load Response List', responseJson.companyName, responseJson.sectionIndex, responseProgressList, responseStep); 


                socket.to(socket.room+'false').emit("Attack Step", responseJson.companyName, responseJson.sectionIndex, responseStep);
                socket.emit("Attack Step", responseJson.companyName, responseJson.sectionIndex, responseStep);

                // 영역의 모든 공격 대응 후 섹션 attackable false, 이전 섹션이 ture가 됨
                if (responseJson.sectionIndex != 0){
                    roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex - 1]["responsible"] = true;
                    roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attackable"] = false;

                    var attack_activationList = [];
                    var response_activationList = [];
                    console.log("[responseCount - Section Activation Check] roomTotalJson[0][companyName]['sections'] : ", roomTotalJson[0][responseJson.companyName]["sections"]);
                    for (let i = 0; i < roomTotalJson[0][responseJson.companyName]["sections"].length; i++){
                        console.log("[responseCount - Section Activation Check] roomTotalJson[0][companyName]['sections'][i] : ", roomTotalJson[0][responseJson.companyName]["sections"][i]);
                        console.log("[responseCount - Section Activation Check] roomTotalJson[0][companyName]['sections'][i]['attackable'] : ", roomTotalJson[0][responseJson.companyName]["sections"][i]["attackable"]);
                        console.log("[responseCount - Section Activation Check] roomTotalJson[0][companyName]['sections'][i]['attackable'] : ", roomTotalJson[0][responseJson.companyName]["sections"][i]["responsible"]);
                        attack_activationList.push(roomTotalJson[0][responseJson.companyName]["sections"][i]["attackable"]);
                        response_activationList.push(roomTotalJson[0][responseJson.companyName]["sections"][i]["responsible"]);
                    }

                    console.log("[Section Activation List - responseCount] attack_activationList : ", attack_activationList);
                    console.log("[Section Activation List - responseCount] response_activationList : ", response_activationList);

                    socket.to(socket.room+'false').emit("Section Activation List", responseJson.companyName, attack_activationList);

                    socket.to(socket.room+'true').emit("Section Activation List", responseJson.companyName, response_activationList);
                    socket.emit("Section Activation List", responseJson.companyName, response_activationList);
                } else {
                    console.log("[Section Response] 해당 회사는 모든 공격을 대응함");
                }

                // let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                console.log("White Team Response list (responseCount) : ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["response"]["progress"]);
                console.log("Black Team Attack list (responseCount) : ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attack"]["progress"]);

                roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attackStep"] = responseStep;
                roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["responseStep"] = responseStep;

                console.log("[setTimeout] roomTotalJson response step ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["responseStep"]);
                console.log("[setTimeout] roomTotalJson response step, responseStep ", responseStep);

                await jsonStore.updatejson(roomTotalJson[0], socket.room);
                roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));                

                console.log("attack step after edit json (attackCount) : ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["attackStep"]);
                console.log("Section Destory Status : ", roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["destroyStatus"]);

                // [GameLog] 로그 추가 - 대응 로그
                const whiteLogJson = JSON.parse(await jsonStore.getjson(socket.room+":whiteLog"));

                let today = new Date();   
                let hours = today.getHours(); // 시
                let minutes = today.getMinutes();  // 분
                let seconds = today.getSeconds();  // 초
                let now = hours+":"+minutes+":"+seconds;

                var companyIdx =  responseJson.companyName.charCodeAt(7) - 65;
                var monitoringLog = {time: now, nickname: socket.nickname, targetCompany: responseJson.companyName, targetSection: sectionNames[companyIdx][responseJson.sectionIndex], actionType: "Response", detail: attack_name_list[responseJson.attackIndex]+"대응이 수행되었습니다."};

                whiteLogJson[0].push(monitoringLog);
                await jsonStore.updatejson(whiteLogJson[0], socket.room+":whiteLog");
                
                var logArr = [];
                logArr.push(monitoringLog);
                io.sockets.in(socket.room+'true').emit('addLog', logArr);
                io.sockets.in(socket.room).emit('updateSectionState', responseJson.companyName, responseJson.sectionIndex);

                // 대응 성공
                gameLogger.info("game:response success", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userId,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : "sdfsdfb124gvv",
                        team : socket.team,
                        companyName : responseJson.companyName,
                        section : responseJson.sectionIndex,
                        state : "success",
                        responseType : responseJson.attackIndex,
                        responseLevel : roomTotalJson[0][responseJson.companyName]["penetrationTestingLV"][responseJson.attackIndex],
                        sectionLevel : roomTotalJson[0][responseJson.companyName]["sections"][responseJson.sectionIndex]["level"],
                        cost : 0,
                        totalPita : roomTotalJson[0].whiteTeam.total_pita
                    },
                });
            }

            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            clearTimeout(responseStepTime);

        }, config["RESPONSE_" + (responseJson.attackIndex + 1)]["time"][cooltimeLv] * 1000);
    }

    // 모든 회사가 몰락인지 확인, 몰락이면 게임 종료
    async function AllAbandon(socket, roomTotalJson){
        console.log("#---------- 게임 종료됨(AllAbandon)----------#");
        var gameover = true;
        for(let company of companyNameList){
            if(roomTotalJson[0][company]["abandonStatus"] == false){
                gameover = false;
                break;
            }
        }
        
        var winTeam = false;
        if(gameover){
            clearInterval(timerId);
            clearInterval(pitaTimerId);
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

                // 개발자 로그 - 게임 종료(모든 회사 몰락)
                gameLogger.info("game:Game Over", {
                    server : 'server1',
                    userIP : '192.0.0.1',
                    sessionID : socket.sessionID,
                    userID : socket.userID,
                    nickname : socket.nickname,
                    data : 	{
                        roomID : socket.room,
                        winTeam : false, 
                        cause : "AllDestroyed", 
                        blackScore : blackScore,
                        whiteScore : whiteScore,
                        blackPita : blackPitaNum,
                        whitePita : whitePitaNum,
                        remainCompanyNum : 0,
                    },
                });

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

        // 개발자 로그 - 게임 종료(시간종료)
        gameLogger.info("game:Game Over", {
            server : 'server1',
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : 	{
                roomID : socket.room,
                winTeam : winTeam, 
                cause : "Timeout", 
                blackScore : blackScore,
                whiteScore : whiteScore,
                blackPita : blackPitaNum,
                whitePita : whitePitaNum,
                remainCompanyNum : aliveCnt,
            },
        });

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

