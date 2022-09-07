/* abstract */ class RoomStore {
    findRooms() {} // 현재 생성된 방 리스트 반환
    checkRooms(room) {} // 해당 방의 존재 여부
    saveRoomPlayer(room, playerID, name) {} // 특정 방에 플레이어 추가 (playerID는 socket.UID)
    findRoomPlayers(room) {} // 해당 방의 플레이어 리스트 반환
    deletePlayer(room, playerID, name) {} // 해당 플레이어가 특정 방을 나감
    deleteRoom(room) {} // 방 자체를 없앰

    createRoom(id, info) {}
    deleteRooms(){}
  }
  
  class InMemoryRoomStore extends RoomStore {
    constructor() {
        super();
        this.rooms = new Map();
    }


    checkRooms(room) {
        if (this.rooms.get(room) == null) {
            return false;
        } else {
            return true;
        }
    }

    findRooms() { // 현재 생성된 방 리스트 반환
        console.log("findRooms : ", [...this.rooms.keys()]);
        return [...this.rooms.keys()];
    }

    findRoomPlayers(room) { // 해당 방의 플레이어 리스트 반환
        // 만약에 찾고자 하는 방이 없으면 1을 리턴
        if (this.rooms.get(room) == null) {
            console.log("findRoomPlayers : 방 없어서 1 리턴");
            return 1;
        } else {
            console.log("findRoomPlayers : ", this.rooms.get(room));
            return this.rooms.get(room);
        }
    }

    deletePlayer(room, player) { // 해당 플레이어가 특정 방을 나감
        if (this.rooms.get(room) == null) {
            console.log("deletePlayer : 방 없음");
        } else {
            var del = this.rooms.get(room)
            del = del.filter(function(item) {
                return item[0] !== player
            });           
            if (del.length == 0){ // 현재 나가는 플레이어가 이 방의 마지막 인원인 경우 방까지 삭제
                this.rooms.delete(room);
            } else {
                this.rooms.set(room, del);
            }
            console.log("deletePlayer : ", this.rooms.keys(), this.rooms.values());
        }
    }

    saveRoomPlayer(room, playerID, name) { 
        this.rooms.set("test", [[1111, 44]]);
        console.log(this.rooms.keys(), this.rooms.values());
        if (this.rooms.get(room) == null) {
            //방이 존재하지 않는 경우 바로 SET
            console.log("no exists!!");
            this.rooms.set(room, [[playerID, name]]);
            console.log("saveRoomPlayer : ", this.rooms.keys(), this.rooms.values());
        } else {
            //방이 존재하는 경우
            console.log("exists!!");
            var players = []
            players = this.rooms.get(room);
            players.push([playerID, name]);
            this.rooms.set(room, players);
            console.log("saveRoomPlayer : ", this.rooms.keys(), this.rooms.values());
        }
        //this.rooms.set(room, player);
    }

    deleteRoom(room) {
        this.rooms.delete(room);
    }
  }
  
//   const SESSION_TTL = 24 * 60 * 60;
  
  class RedisRoomStore extends RoomStore {
    constructor(redisClient) {
      super();
      this.redisClient = redisClient;
    }

    // 방 존재 여부 확인 함수
    async IsValidRoom(id){
        var check = await this.redisClient.lrange("room_Server", 0, -1)
        if (check.includes(id)){
            return true;
        } else {
            return false;
        }
    }


    //새로 만든 함수
    async createRoom(id, info) { //id는 문자열, info는 JSON
        // room hashtable 생성 
        console.log("createRoom");
        this.redisClient
        .multi()
        .hset(
          `room:${id}`,
          "Info",
          JSON.stringify(info),
        )
        .exec();
        //room 리스트 추가
        //console.log("room_s:", await this.redisClient.exists("room_Server"));
        this.redisClient.lpush("room_Server", id);
        //있으면 1, 없으면 0
    }

    deleteRooms(id){ //해당 룸에 대한 해시테이블 전체 삭제 및 룸 리스트에서 삭제
        console.log("deleteRooms");
        this.redisClient.del(`room:${id}`);
        this.redisClient.lrem("room_Server", 0, id);
    }

    async addMember(roomid, userid, user_json) {
        const check_m = await this.redisClient.hsetnx(`room:${roomid}`, userid, JSON.stringify(user_json));
        // 0 이면 실패
        if (check_m == 0){
            console.log("이미 있음");
            return false
        } else {
            return true
        }

    }

    delMember(roomid, userid) {
        this.redisClient.hdel(`room:${roomid}`, userid);
    }

    async getMember(roomid, userid){
        const getm = await this.redisClient.hmget(`room:${roomid}`, userid);
        //const j = JSON.parse(getm[0])
        return JSON.parse(getm[0]);
    }

    async updateMember(roomid, userid, user_json){ //단, 기존 멤버가 있는지 확인 후 업데이트
        
        const arr = await this.redisClient.hkeys(`room:${roomid}`);
        if (arr.includes(userid)){
            this.redisClient.hset(`room:${roomid}`, userid, JSON.stringify(user_json));
            return true;
        } else {
            console.log("updateMember: 없는 이름입니다")
            return false;
        }
    }

    async viewRoomList(){
        return await this.redisClient.lrange("room_Server", 0, -1);
    }

    async RoomMembers_num(roomid){
        return await this.redisClient.hlen(`room:${roomid}`) - 1;
    }

    async RoomMembers(roomid){ //Info 빼주기
        let mem = await this.redisClient.hkeys(`room:${roomid}`);
        for(let i = 0; i <mem.length; i++){
            if(mem[i] === 'Info'){
                mem.splice(i, 1);
                i--;
            }
        }
        return mem
    }

    RoomInfo(roomid, info_json){ //업데이트 저장 다 포함
        this.redisClient.hset(`room:${roomid}`, "Info", JSON.stringify(info_json));
    }
    
    //Info불러오는 함수
    async getRoomInfo(roomid){
        return await this.redisClient.hmget(`room:${roomid}`, "Info");
    }


  }
  module.exports = {
    InMemoryRoomStore,
    RedisRoomStore,
  };
  