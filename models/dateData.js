var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var nowDate = require('../utils/utils').getToday().dateStr

var dateData = new Schema({
    code: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    column: {
        type: [String]
    },
    data: {

    }
})

module.exports = DateData = mongoose.model('dataData', dateData, nowDate);