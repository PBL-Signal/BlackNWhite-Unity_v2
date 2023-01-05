const mongoose = require('mongoose');
const { Schema } = mongoose;
const Section = require('./Section').schema;


const Company = new Schema({
    abandonStatus : { type : Boolean, required : true },
    penetrationTestingLV : { type : Array, required : true },
    attackLV : { type : Array, required : true },
    beActivated : { type : Array, required : true },   // 0 : 비활성화, 1 : 활성화, 2: 비활성화 중 공격됨
    defenseActive : { type : Array, required : true },
    sections : [Section]
})

module.exports = mongoose.model('Company', Company);