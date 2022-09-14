const mongoose = require('mongoose');
const { Schema } = mongoose;
const BlackUsers = require('./BlackUsers').schema;

const BlackTeam = new Schema({
    total_pita   : { type : Number, required : true },
    users   : { type : {}, required : true },
    scenarioLevel :  { type : Array, required : true }, // 힌트북 레벨
})

module.exports = mongoose.model('BlackTeam', BlackTeam);