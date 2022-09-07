const mongoose = require('mongoose');
const { Schema } = mongoose;
const Section = require('./Section').schema;


const Company = new Schema({
    abandonStatus : { type : Boolean, required : true },
    penetrationTestingLV : { type : Array, required : true },
    attackLV : { type : Array, required : true },
    sections : [Section]
})

module.exports = mongoose.model('Company', Company);