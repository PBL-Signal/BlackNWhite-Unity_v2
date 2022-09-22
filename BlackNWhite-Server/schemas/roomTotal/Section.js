const mongoose = require('mongoose');
const { Schema } = mongoose;
const progress = require('./Progress').schema;

const Section = new Schema({
    attackable : { type : Boolean, required : true },
    responsible : { type : Boolean, required : true },
    destroyStatus  : { type : Boolean, required : true },
    level  : { type : Number, required : true },
    suspicionCount : { type : Number, required : true },   // 회사 별 첫 취약점 공격 인덱스
    attackStep : { type : Number, required : true },   // 수행을 시작한 공격 단계를 뜻함
    responseStep : { type : Number, required : true },   // 수행해야 할 관제 단계를 뜻함 (현재는 성공한 관제 단계 -> 추후 회의를 통해 정확한 사용 방법 정해야 됨)
    attack : { type : progress, required : true },
    response : { type : progress, required : true },
    beActivated : { type : Array, required : true },
    responseActive : { type : Array, required : true },
    responseLv : { type : Array, required : true },
    responseCnt : { type : Array, required : true },


})

module.exports = mongoose.model('Section', Section); 