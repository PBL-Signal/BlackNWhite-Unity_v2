const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyPaser = require('body-parser');

const socketio = require("socket.io");
const socketredis = require("socket.io-redis");

const REDIS_PORT = 6379
const REDIS_URL = "redis-test.i187of.ng.0001.use1.cache.amazonaws.com"

const app = express();
const server = http.createServer(app);
const io = socketio(server,{
    cors: {
        origin: "*",
    },

    transport: ["websocket"]
});


io.adapter(socketredis({host: REDIS_URL, port: REDIS_PORT}));

const { setupWorker } = require("@socket.io/sticky");
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

setupWorker(io);
require('./io-handler')(io);

app.use(cors());
app.use(bodyPaser.json());
app.use(bodyPaser.urlencoded({extended: false}));
app.use(express.json());

