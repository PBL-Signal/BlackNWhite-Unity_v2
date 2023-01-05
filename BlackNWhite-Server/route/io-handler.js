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


const preGameHandlers = require("./preGame");
const gameHandlers = require("./mainGame");

const {lobbyLogger, gameLogger, chattingLogger} = require('../logConfig'); 
var server_ip = "128.0.0.1";

String.prototype.replaceAt = function(index, replacement) {
    if (index >= this.length) {
        return this.valueOf();
    }

    return this.substring(0, index) + replacement + this.substring(index + 1);
}

module.exports = (io) => {
    
    let companyNameList = ["companyA", "companyB", "companyC", "companyD", "companyE"];
    let taticNamesList = ["Reconnaissance", "Resource Development", "Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Collection", "Command and Control", "Exfiltration", "Impact"];
    let areaNameList = ["DMZ", "Internal", "Security"]

    let timerId;
    let pitaTimerId;

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
        preGameHandlers(io, socket);
        gameHandlers(io, socket);
    }  

    io.on('connection', onConnection);    
}