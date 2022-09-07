const mongoose = require('mongoose');
const { Schema } = mongoose;
const WhiteUsers = require('./WhiteUsers').schema;

const WhiteTeam = new Schema({
    total_pita   : { type : Number, required : true },
    users   : { type : {}, required : true },
})

module.exports = mongoose.model('WhiteTeam', WhiteTeam);