const mongoose = require('mongoose');
const { Schema } = mongoose;

const Section = new Schema({
    attackable : { type : Boolean, required : true },
    defensible : { type : Boolean, required : true },
    destroyStatus  : { type : Boolean, required : true },
    level  : { type : Number, required : true },
    suspicionCount : { type : Number, required : true },   // 회사 별 첫 취약점 공격 인덱스
    defenseActive : { type : Array, required : true },
    attackProgress : { type : Array, required : true },
    defenseProgress : { type : Array, required : true },
    // defenseStep : { type : Number, required : true },   // 수행해야 할 관제 단계를 뜻함 (현재는 성공한 관제 단계 -> 추후 회의를 통해 정확한 사용 방법 정해야 됨)
    //defense : { type : progress, required : true },
    beActivated : { type : Array, required : true },
    defenseActive : { type : Array, required : true },
    defenseLv : { type : Array, required : true },
    defenseCnt : { type : Array, required : true },


})

module.exports = mongoose.model('Section', Section); 