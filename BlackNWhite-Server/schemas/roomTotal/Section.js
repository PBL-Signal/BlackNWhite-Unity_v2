const mongoose = require('mongoose');
const { Schema } = mongoose;

const Section = new Schema({
    attackable : { type : Boolean, required : true },
    defensible : { type : Boolean, required : true },
    destroyStatus  : { type : Boolean, required : true },
    level  : { type : Number, required : true },
    suspicionCount : { type : Number, required : true },   // 회사 별 첫 취약점 공격 인덱스
    attackProgress : { type : Array, required : true },
    attackSenarioProgress : { type : Array, required : true },
    defenseProgress : { type : Array, required : true },
    beActivated : { type : Array, required : true },   // 0 : 비활성화, 1 : 활성화, 2: 비활성화 중 공격됨
    defenseActive : { type : Array, required : true },
    defenseLv : { type : Array, required : true },
    defenseCnt : { type : Array, required : true },
    attackConn   : { type : {}, required : true },
})

module.exports = mongoose.model('Section', Section); 