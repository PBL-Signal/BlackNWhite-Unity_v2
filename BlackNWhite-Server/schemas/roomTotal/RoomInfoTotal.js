const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = require('./User').schema;
const RoomInfo = require('./RoomInfo').schema;

const RoomInfoTotal = new Schema({
   Users : { type : {}, required : true },
   Info : { type : RoomInfo, required : true },
})

module.exports = mongoose.model('RoomInfoTotal', RoomInfoTotal);