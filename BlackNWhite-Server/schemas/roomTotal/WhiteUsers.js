const mongoose = require('mongoose');
const { Schema } = mongoose;

const WhiteUsers = new Schema({
    userId   : { type : String, required : true },
    profileColor : { type : Number, required : true },
    currentLocation    : { type : String, required : true },
})

module.exports = mongoose.model('WhiteUsers', WhiteUsers);