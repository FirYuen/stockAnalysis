var config = require("../config/config")
var dateData = require("./dateData")
var mongoose = require("mongoose")
var db = require('../config/config').mongoURI
console.log(db)
// connect to mongodb
mongoose.connect(db, { useNewUrlParser: true })
    .then((client) => {
        console.log('MongoDB Connected');
    })
    .catch(err => console.log(err))

var dataFiled = {
    "data":
    {
        "symbol": "SZ159959",
        "column": ["timestamp", "volume", "open", "high", "low", "close", "chg", "percent", "turnoverrate", "ma5", "ma10", "ma20", "ma30", "dea", "dif", "macd", "ub", "lb", "ma20", "kdjk", "kdjd", "kdjj", "rsi1", "rsi2", "rsi3", "wr6", "wr10", "bias1", "bias2", "bias3", "cci", "psy", "psyma"],
        "item": [
            [1551628800000, 13427726, 1.095, 1.118, 1.095, 1.098, 0.005, 0.46, 0, 1.084, 1.0616, 1.0254, null, 0.0197, 0.0279, 0.0164, 1.1125, 0.9383, 1.0254, 83.2578, 84.2555, 81.2624, 89.6487, 85.1132, 81.5054, 24.3902, 20.202, 1.4006, 4.191, 8.0133, 122.1837, 75, 76.3889]
        ],
        "sName": "银华央企"
    },
    "error_code": 0,
    "error_description": ""
}.data

let data = {
    code: dataFiled.symbol,
   name: dataFiled.sName,
    data: {}
}

dataFiled.column.forEach((ele, i) => {
    data.data[ele] = dataFiled.item[0][i]
})

new dateData(data).save().then((profile) => {

    mongoose.disconnect()
}).catch(err => console.log(err))