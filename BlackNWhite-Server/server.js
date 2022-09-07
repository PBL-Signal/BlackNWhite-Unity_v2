const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyPaser = require('body-parser');
const REDIS_PORT = 6380;

// const mongoose = require('mongoose');
const socketio = require("socket.io");
const Redis = require("ioredis"); 
const socketredis = require("socket.io-redis");



const app = express();
const redisClient = new Redis(REDIS_PORT);
const server = http.createServer(app);

const io = socketio(server,{
    cors: {
        origin: ['http://localhost:5693'],
        methods: ["GET", "POST"]
    },
   
    transport: ["websocket"]
});

io.adapter(socketredis({host: 'localhost', port: 6380}));


const { setupWorker } = require("@socket.io/sticky");
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

setupWorker(io);
require('./io-handler')(io);

app.use(cors());
app.use(bodyPaser.json());
app.use(bodyPaser.urlencoded({extended: false}));
app.use(express.json());

