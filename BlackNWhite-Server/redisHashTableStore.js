/* abstract */ class HashTableStore {
    storeHashTable(key, field_value, ...args){} // 저장 함수
    deleteHashTable(key, ...args){}  // 해쉬 테이블 전체 삭제 함수
    deleteHashTableField(key, field, ...args){} //필드 값 삭제
    updateHashTableField(key, field, value, ...args){} // 필드 값 업데이트
    addHashTableField(key, field, value, ...args){}// 필드 추가(필드 값이 있는 경우에만 추가하는 옵션 추가 가능)
    isExistHashTableField(key, field, ...args){} // 필드의 존재 유무 확인(존재하면 true, 아니면 false)
    getHashTableFieldValue(key, field_list, ...args){}// 필드에 저장된 값 조회
    getHashTableFields(key, ...args){} // Key에 저장된 모든 필드 명 조회
    getHashTableValues(key, ...args){} // Key에 저장된 모든 값 조회
    getAllHashTable(key, ...args){} // key에 저장된 모든 필드와 그 값들
}

class redisHashTableStore extends HashTableStore {
    constructor(redisClient) {
        super();
        this.redisClient = redisClient;
    }

    storeHashTable(key, field_value, ...args){ // key, json, namespace
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        if (this.redisClient.multi().hset(`hashtable${namespace}${key}`, field_value).exec() == 1){
            return true;
        } else {
            return false;
        }
    }

    deleteHashTable(key, ...args){ // 전체 삭제
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        if (this.redisClient.del(`hashtable${namespace}${key}`) == 1){
            return true;
        } else {
            return false;
        }
    }

    deleteHashTableField(key, field, ...args){ // 필드 삭제
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        if (this.redisClient.hdel(`hashtable${namespace}${key}`, field) == 1){
            return true;
        } else {
            return false;
        }
    }

    async updateHashTableField(key, field, value, ...args){// 필드 값 업데이트
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        if (await this.redisClient.hexists(`hashtable${namespace}${key}`, field) == 1){// 필드가 있는지 확인
            this.redisClient.hset(`hashtable${namespace}${key}`, field, value);
            console.log("-------확인 " ,key, field);
            return true;
        } else {
            console.log(`해당 ${key}에 ${field}는 존재하지 않습니다.`);
            return false;
        }
    }


    addHashTableField(key, field, value, ...args){// 필드 추가(필드 값이 있는 경우에만 추가하는 옵션 추가 가능)
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        if(this.redisClient.hsetnx(`hashtable${namespace}${key}`, field, value) == 1){ //0이면 이미 존재, 1이면 새로 추가
            return true;
        } else {
            console.log("이미 해당 field는 존재합니다");
            return false;
        }
    }


    isExistHashTableField(key, field, ...args){// 필드의 존재 유무 확인(존재하면 1, 아니면 0)
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        if (this.redisClient.hexists(`hashtable${namespace}${key}`, field) == 1){
            return true; // 존재
        } else {
            return false; // 존재 안함
        }
    } 


    getHashTableFieldValue(key, field_list, ...args){ // 필드에 저장된 값 조회
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        return this.redisClient.hmget(`hashtable${namespace}${key}`, field_list);//[]리스트 형식으로 반환
    }


    getHashTableFields(key, ...args){ // Key에 저장된 모든 필드 명 조회
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        return this.redisClient.hkeys(`hashtable${namespace}${key}`);//[]리스트 형식으로 반환
    } 
 
    getHashTableValues(key, ...args){ // Key에 저장된 모든 값 조회
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        return this.redisClient.hvals(`hashtable${namespace}${key}`); //[]리스트 형식으로 반환
    } 

    getAllHashTable(key, ...args){ // key에 저장된 모든 필드와 그 값들
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        return this.redisClient.hgetall(`hashtable${namespace}${key}`);
        //{ 'email': 'mini@naver.com', 'id' : 'mini' } 처럼 { field : value, … } 형식으로 리턴됨.
    } 

}

module.exports = {
    redisHashTableStore
};