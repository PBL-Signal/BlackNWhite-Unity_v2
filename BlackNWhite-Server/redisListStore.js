/* abstract */ class ListStore {
    lstoreList(key, value_list, check, ...args){} // list 통째로 저장 함수
    rstoreList(key, value_list, check, ...args){} // list 통째로 저장 함수
    lpushList(key, value, check, ...args){} // 요소 하나씩 저장
    rpushList(key, value, check, ...args){} // 요소 하나씩 저장
    delElementList(key, count, element, ...args){} // 리스트 속 요소 삭제
    deleteList(key, ...args){}  // 리스트 전체 삭제 함수
    lpopList(key, ...args){}
    rpopList(key, ...args){}
    lenList(key, ...args){}
    rangeList(key, startIndex, stopIndex, ...args){}
    setList(key, Index, element, ...args){}
    
}

class redisListStore extends ListStore {
    constructor(redisClient) {
        super();
        this.redisClient = redisClient;
    }

    async rstoreList(key, value_list, check, ...args){ // list 통째로 저장 함수(값을 한번에 여러개 저장하기) 값이 추가되는 것임
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        if (check == true){
            try {
                await this.redisClient.rpushx(`hashtable${namespace}${key}`, ...value_list);
                return true;
            } catch(e) {
                console.log(e.message);
                return false
            }
        } else if (check == false){
            try {
                await this.redisClient.rpush(`hashtable${namespace}${key}`, ...value_list);
                return true;
            } catch(e) {
                console.log(e.message);
                return false
            }
        } else {
            console.log("check must be Boolean");
            return false;
        }

    }

    async lstoreList(key, value_list, check, ...args){ // list 통째로 저장 함수(값을 한번에 여러개 저장하기) 값이 추가되는 것임
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        if (check == true){
            try {
                await this.redisClient.lpushx(`hashtable${namespace}${key}`, ...value_list);
                return true;
            } catch(e) {
                console.log(e.message);
                return false
            }
        } else if (check == false){
            try {
                await this.redisClient.lpush(`hashtable${namespace}${key}`, ...value_list);
                return true;
            } catch(e) {
                console.log(e.message);
                return false
            }
        } else {
            console.log("check must be Boolean");
            return false;
        }

    }



    async lpushList(key, value, check, ...args){ // value is list type
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        // 만약 매개변수 하나면 value는 공백으로 간주
        if (check == true){ // 값이 이미 있는 곳에 넣기
            try {
                await this.redisClient.lpushx(`hashtable${namespace}${key}`, value);
                return true;
            } catch(e){
                console.log(e.message);
                return false;
            }
        } else if (check == false){ // 아닌 곳에는 새로 생성해서 넣기
            try {
                await this.redisClient.lpush(`hashtable${namespace}${key}`, value);
                return true;
            } catch(e){
                console.log(e.message);
                return false;
            }
        } else {
            console.log("check must be Boolean");
            return false;
        }
    }

    async rpushList(key, value, check, ...args){ // value is list type
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        // 만약 매개변수 하나면 value는 공백으로 간주
        if (check == true){ // 키가 값이 이미 있는 곳에 넣기
            try {
                await this.redisClient.rpushx(`hashtable${namespace}${key}`, value);
                return true;
            } catch(e){
                console.log(e.message);
                return false;
            }
        } else if (check == false){ // 키가 아닌 곳에는 생성해서 넣기
            try {
                await this.redisClient.rpush(`hashtable${namespace}${key}`, value);
                return true;
            } catch(e){
                console.log(e.message);
                return false;
            }
        } else {
            console.log("check must be Boolean");
            return false;
        }
    }

    delElementList(key, count, element, ...args){
        // count가 0이면 모두 삭제, count가 0보다 작으면 우측부터, 크면 좌측부터 삭제
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        if(this.redisClient.lrem(`hashtable${namespace}${key}`, count, element) == 1){
            return true;
        } else {
            return false;
        }
    }

    async lpopList(key, ...args){ // 맨 좌측에 있는 요소 제거 후 제거한 값을 리턴
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        try{
            await this.redisClient.lpop(`hashtable${namespace}${key}`);
            return true;
        }catch(e){
            console.log(e.message);
            return false;
        }
    }

    async rpopList(key, ...args){ // 맨 우측에 있는 요소 제거 후 제거한 값을 리턴
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        try{
            await this.redisClient.rpop(`hashtable${namespace}${key}`);
            return true;
        }catch(e){
            console.log(e.message);
            return false;
        }
    }

    async lenList(key, ...args){ // 키에 저장된 list 길이를 반환, 키가 없으면 빈 목록으로 인식하고 0을 반환 만약 list가 아니면 오류 반환 
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        try{
            return await this.redisClient.llen(`hashtable${namespace}${key}`);
        }catch(e){
            console.log(e.message);
            return false;
        }
        
    }

    async rangeList(key, startIndex, stopIndex, ...args){
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        try{
            return await this.redisClient.lrange(`hashtable${namespace}${key}`, startIndex, stopIndex);
            // return true;
        }catch(e){
            console.log(e.message);
            return false;
        }
    }

    async setList(key, Index, element, ...args){ // 해당 index에 대한 값을 입력받은 값으로 변경
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        try{
            await this.redisClient.lset(`hashtable${namespace}${key}`, Index, element);
            return true;
        }catch(e){
            console.log(e.message);
            return false;
        }
    }

    async deleteList(key, ...args) {
        var namespace = ":"
        for(var i=0; i < args.length; i++){
            namespace = namespace + String(args[i]) + ":"
        }
        var check = await this.redisClient.exists(`hashtable${namespace}${key}`);
        if (check == 1){
            this.redisClient.del(`hashtable${namespace}${key}`);
        }
    }

    


}

module.exports = {
    redisListStore
};