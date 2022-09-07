const mongoose = require('mongoose');
const { Schema } = mongoose;

const Progress = new Schema({
    progress  : { type : Object, required : true },
    inProgress  : { type : Object, required : true },
    last  : { type : Number, required : true },
})

module.exports = mongoose.model('Progress', Progress);