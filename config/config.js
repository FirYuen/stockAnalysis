var dateStr = require("../utils/utils").getToday().dateStr
var interceptor = require("./interceptor")
var path = require("path")
var fileDir = path.format({
    dir: __dirname + `/../storage/${dateStr}`
})

module.exports = {
    stockCount: 10, //'ALL', //'ALL' //接受number 或者 字符串 ALL
    interval: 1000,
    analysis: true,
    fetchTodayData: true,
    mailNotify: true,
    days: -1,
    mongoURI: 'mongodb://stock:stock@47.101.153.129:27017/stockData',
    fileDir: fileDir, // __dirname,
    fsName: {
        dateJSON: path.format({
            dir: fileDir,
            name: `${dateStr}`,
            ext: '.json'
        }),
        dataHtml: path.format({
            dir: fileDir,
            name: `${dateStr}`,
            ext: '.html'
        }),
        dateAnalysisMD: path.format({
            dir: fileDir,
            name: `${dateStr}`,
            ext: '.md'
        }),
        dateAnalysisJSON: path.format({
            dir: fileDir,
            name: `${dateStr}-analysis`,
            ext: '.json'
        }),
        mailText: path.format({
            dir: fileDir,
            name: `${dateStr}`,
            ext: '.txt'
        })
    }
}