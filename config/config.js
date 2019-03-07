var dateStr = require("../utils/utils").getToday().dateStr
var interceptor = require("./interceptor")
var path = require("path")
var fileDir = path.format({
    dir: __dirname + `/../storage/${dateStr}`
})

module.exports = {
    stockCount: 'ALL', //'ALL' //接受number 或者 字符串 ALL
    interval: 1000,
    analysis: true,
    fetchTodayData: true,
    onlyTodayData: true,
    mailNotify: true,
    days: -1,
    mongoURI: 'mongodb://stock:stock@localhost:27017/stockData',
    fileDir: fileDir, // __dirname,
    fsName: {
        dateJSON: path.format({
            dir: fileDir,
            base: `${dateStr}.json`,

        }),
        dataHtml: path.format({
            dir: fileDir,
            base: `${dateStr}.html`,

        }),
        dateAnalysisMD: path.format({
            dir: fileDir,
            base: `${dateStr}.md`,

        }),
        dateAnalysisJSON: path.format({
            dir: fileDir,
            base: `${dateStr}-analysis.json`,

        }),
        mailText: path.format({
            dir: fileDir,
            base: `${dateStr}.txt`,

        })
    }
}