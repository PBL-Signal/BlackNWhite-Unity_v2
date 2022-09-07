// schemas/room.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const monitoringLog = new Schema({
    time : { type : String, required : true },
    nickname : { type : String, required : true },
    targetCompany : { type : String, required : true },
    targetSection : { type : String, required : true },
    actionType : { type : String, required : true },
    detail : { type : String, required : true }
})


module.exports = mongoose.model('monitoringLog', monitoringLog);


// 시간 누구 회사 섹션 관제/공격/대응 디테일