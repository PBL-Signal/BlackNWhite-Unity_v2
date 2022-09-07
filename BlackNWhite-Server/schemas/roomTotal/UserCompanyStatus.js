const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserCompanyStatus = new Schema({
    warnCnt    : { type : Number, required : true },
    detectCnt    : { type : Array, required : true },
})

module.exports = mongoose.model('UserCompanyStatus', UserCompanyStatus);