var readLine = require('lei-stream').readLine;
var fs = require("fs")
var utils = require('./utils')
var interceptor = require('../config/interceptor')
var fsName = require("../config/config").fsName


//分析数据
function analysis(fsPath) {
    let analysisArr = []
    let analysisMD = ''
    let text = " "
    let line = readLine(fs.createReadStream(fsPath), {
        // 换行符，默认\n
        newline: '\n',
        // 是否自动读取下一行，默认false
        autoNext: false,
        // 编码器，可以为函数或字符串（内置编码器：json，base64），默认null
        encoding: function (data) {
            return JSON.parse(data);
        }
    });
    line.on('data', (json) => {
        let data = json
        let afterFilter = interceptor.interceptor(data)
        if (afterFilter) {
            let { FSD, str, mdStr } = afterFilter
            analysisArr.push(FSD)
            analysisMD = analysisMD + mdStr
            text = text + str
        }
        line.next()
    })
    line.on('end', () => {
        utils.writefs(fsName.dateAnalysisMD, analysisMD)
        let analysisJSON = {}
        analysisArr.forEach((e, i) => {
            analysisJSON[i] = e
        });
        utils.writefs(fsName.dateAnalysisJSON, JSON.stringify(analysisJSON))
        utils.writefs(fsName.mailText, text)
        console.log(`    Anaysis end`);
    });

}
module.exports = {
    analysis: analysis
}