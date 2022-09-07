/* abstract */ class JsonStore {
    test(whiteTeam, main_key) {}
    storejson(schema, key) {}
    getjson(key) {}
    deletejson(key) {} // json 스키마 통째로 저장
    updatejson(schema, key) {}
}

class RedisJsonStore extends JsonStore {
    constructor(redisClient) {
      super();
      this.redisClient = redisClient;
    }

    async storejson(schema, key){
        return await this.redisClient.call("JSON.SET", key, "$", JSON.stringify(schema))=="OK";
        //나중에 키 중복 체크하기
    }

    async getjson(key){
        const json = await this.redisClient.call("JSON.GET", key, "$"); // 없으면 null
        //console.log(json);
        return json;
    }

    async deletejson(key){
        var value = await this.redisClient.call("JSON.DEL", key, "$");
        if (value == 1){
            return true;
        } else {
            return false;
        }
    }

    async updatejson(schema, key){
        //console.log(await this.redisClient.call("keys", "*"), key);
        const arr = await this.redisClient.call("keys", "*");
        //console.log(arr.includes(key));
        if (arr.includes(key)){
            return await this.redisClient.call("JSON.SET", key, "$", JSON.stringify(schema))=="OK";
        } else {
            return "해당 키는 없음";
        }
        
    }

    async test(whiteTeam, main_key) {
        //'{"total_pita" : 24, "users" : {"userId" : 123, "IsBlocked": 123, "currentLocation" : "서울"}}'
        await this.redisClient.call("JSON.SET", main_key, "$", JSON.stringify(whiteTeam));
        //const json = await this.redisClient.call("JSON.GET", "whiteTeam", "$.users"); // 없으면 null
        //console.log(json);
    }

    async get(key) {
        const json = await this.redisClient.call("JSON.GET", "whiteTeam", "$"); // 없으면 null
        //console.log(json);
        return json;
    }

}




module.exports = {
    RedisJsonStore,
};