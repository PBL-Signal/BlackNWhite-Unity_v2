const mongoose = require('mongoose');
const { Schema } = mongoose;

// 사용 안 함 - 220908
const UserCompanyStatus = new Schema({
    warnCnt    : { type : Number, required : true },
    detectCnt    : { type : Array, required : true },
})

module.exports = mongoose.model('UserCompanyStatus', UserCompanyStatus);