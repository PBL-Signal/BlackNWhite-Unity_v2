/* abstract */ class SessionStore {
    findSession(id) {}
    saveSession(id, session) {}
    findAllSessions() {}
    deleteSession(id) {}
  }
  
  class InMemorySessionStore extends SessionStore {
    constructor() {
      super();
      this.sessions = new Map();
    }
  
    findSession(id) {
        return this.sessions.get(id);
    }
  
    saveSession(id, session) {
        console.log("saveSession 함수 호출");
        this.sessions.set(id, session);
    }
  
    findAllSessions() {
        return [...this.sessions.values()];
    }

    deleteSession(id) {
        this.sessions.delete(id);
    }
  }
  
  const SESSION_TTL = 24 * 60 * 60;
  const mapSession = ([userID, username, connected]) =>
    userID ? { userID, username, connected: connected === "true" } : undefined;
  
  class RedisSessionStore extends SessionStore {
    constructor(redisClient) {
      super();
      this.redisClient = redisClient;
    }
  
    findSession(id) {
      return this.redisClient
        .hmget(`session:${id}`, "userID", "username", "connected")
        .then(mapSession);
    }
  
    async saveSession(id, { userID, username, connected }) {
        console.log("saveSession OUT : "+ id, userID, username, connected); 
     
        // this.redisClient.set("key1","value2");
        try{
            console.log("saveSession IN : "+ id,userID, username, connected); 
          
            this.redisClient
              .multi()
              .hset(
                `session:${id}`,
                "userID",
                userID,
                "username",
                username,
                "connected",
                connected
              )
              .expire(`session:${id}`, SESSION_TTL)
              .exec().catch( 
                function (error) {
                console.log('catch handler', error);
                });
      
        }catch(error){
          console.log("error");
        }
    
    }

    async deleteSession(id) {
        let check = await this.redisClient.exists(`session:${id}`);
        console.log(check);
        if (check == 1){
            this.redisClient.hdel(`session:${id}`, "userID", "username", "connected");
        }
    }
  
    async findAllSessions() {
      const keys = new Set();
      let nextIndex = 0;
      do {
        const [nextIndexAsStr, results] = await this.redisClient.scan(
          nextIndex,
          "MATCH",
          "session:*",
          "COUNT",
          "100"
        );
        nextIndex = parseInt(nextIndexAsStr, 10);
        results.forEach((s) => keys.add(s));
      } while (nextIndex !== 0);
      const commands = [];
      keys.forEach((key) => {
        commands.push(["hmget", key, "userID", "username", "connected"]);
      });
      return this.redisClient
        .multi(commands)
        .exec()
        .then((results) => {
          return results
            .map(([err, session]) => (err ? undefined : mapSession(session)))
            .filter((v) => !!v);
        });
    }
  }
  module.exports = {
    InMemorySessionStore,
    RedisSessionStore,
  };
  