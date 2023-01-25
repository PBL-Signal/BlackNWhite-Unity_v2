const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyPaser = require('body-parser');

const socketio = require("socket.io");
const socketredis = require("socket.io-redis");

// aws server
// const REDIS_PORT = 6379
// const REDIS_URL = "redis-test.i187of.ng.0001.use1.cache.amazonaws.com"

// const app = express();
// const server = http.createServer(app);
// const io = socketio(server,{
//     cors: {
//         origin: "*",
//     },

//     transport: ["websocket"]
// });

/* local server */
const REDIS_PORT = 6380
const REDIS_URL = "localhost"

const app = express();
const server = http.createServer(app);
const io = socketio(server,{
    cors: {
        origin: ['http://localhost:5693'],
        methods: ["GET", "POST"]
    },

    transport: ["websocket"]
});

io.adapter(socketredis({host: REDIS_URL, port: REDIS_PORT}));

const { setupWorker } = require("@socket.io/sticky");
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

setupWorker(io);

/* aws server */
// const Redis = require("ioredis"); 
// const redisClient = new Redis(REDIS_PORT, REDIS_URL);

/* local server */
const Redis = require("ioredis"); 
const redisClient = new Redis(REDIS_PORT);

require('./route/io-handler')(io, redisClient);

app.use(cors());
app.use(bodyPaser.json());
app.use(bodyPaser.urlencoded({extended: false}));
app.use(express.json());

