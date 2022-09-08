const mongoose = require('mongoose');
const { Schema } = mongoose;
const UserCompanyStatus = require('./UserCompanyStatus').schema;

const BlackUsers = new Schema({
    userId   : { type : String, required : true },
    profileColor : { type : Number, required : true },
    currentLocation : { type : String, required : true },
})

module.exports = mongoose.model('BlackUsers', BlackUsers);