const config = require('../configure');
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const preGameHandlers = require("./preGame");
const gameHandlers = require("./mainGame");

module.exports = (io, redisClient) => {
    const { RedisSessionStore } = require("../sessionStore");
    const sessionStore = new RedisSessionStore(redisClient);

    io.use(async (socket, next) => {
        const sessionID = socket.handshake.auth.sessionID;

        const session = await sessionStore.findSession(sessionID);

        if(sessionID){
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.nickname = session.username;
            console.log("io.use 세션 있음", session.userID, sessionID);
            return next();
        }

        const username = socket.handshake.auth.username;

        if (!username) {
            return next(new Error("invalid username")); 
        }
        
        socket.sessionID = randomId();
        socket.userID = randomId();
        socket.nickname = username;

        next();
    });

    const onConnection = async(socket) => {
        preGameHandlers(io, socket, redisClient);
        gameHandlers(io, socket, redisClient);
    }  

    io.on('connection', onConnection);    
}