const mongoose = require('mongoose');
const { Schema } = mongoose;

const Section = new Schema({
    attackable : { type : Boolean, required : true },
    responsible : { type : Boolean, required : true },
    destroyStatus  : { type : Boolean, required : true },
    level  : { type : Number, required : true },
    suspicionCount : { type : Number, required : true },   // 회사 별 첫 취약점 공격 인덱스
    responseActive : { type : Array, required : true },
    attackProgress : { type : Array, required : true },
})

module.exports = mongoose.model('Section', Section); 