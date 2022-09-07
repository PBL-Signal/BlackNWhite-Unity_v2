const mongoose = require('mongoose');
const { Schema } = mongoose;

const User = new Schema({
    userID   : { type : String, required : true },
    nickname : { type : String, required : true },
    team : { type : Boolean, required : true },
    status : { type : Number, required : true },
    color :{ type : Number, required : true },
    place :{ type : String, required : true },
    socketID : { type : String, required : true },
})

module.exports = mongoose.model('User', User);