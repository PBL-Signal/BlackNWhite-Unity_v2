const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomInfo = new Schema({
    roomID :  { type : String, required : true },
    roomPin :  { type : String, required : true },
    creationDate :  { type : Date, required : true },
    roomType :  { type : String, required : true },
    maxPlayer :  { type : Number, required : true },
})

module.exports = mongoose.model('RoomInfo', RoomInfo);