var request = require('request')
var fs = require("fs")
var ProgressBar = require('cli-progress');
var readLine = require('lei-stream').readLine;
var nodemailer = require("nodemailer");
var path = require('path')
var interceptor = {
    analysis: true,
    fetchTodayData: true,
    mailNotify: true,
    interval: 1000,
    k: 25,
    d: 25,
    j: 25,
    rsi: 30,
    macdMin: -0.4,
    macdMax: 0.1,
    priceMin: 4.00,
    priceMax: 80.00,
    requireMACD: true,
    requireKDJ: true,
    requireRSI: true,
    requirePrice: true,
    STinclude: false,
    days: -1,
    //fileDir: '/Users/yuanpengfei/Repo/stockAnalysis/',
    fileDir: __dirname,
    stockCount: 3, //'ALL', //'ALL' //接受number 或者 字符串 ALL
    interceptor: function (data) {
        let FSD = formatedStockData(data)
        let {
            code,
            name,
            timestamp,
            open,
            percent,
            macd,
            kdjk,
            kdjd,
            kdjj,
            rsi1
        } = FSD
        FSD.url = 'https://xueqiu.com/S/' + code
        let str = `${code} ${name} 价格: ${open} 涨跌: ${percent} ${macd} ${kdjk} ${kdjd} ${kdjj} ${rsi1}`
        if (this.matchMACD(macd) && this.matchPrice(open) && this.includeST(name) && this.matchKDJ(kdjk, kdjd, kdjj) && this.matchRSI(rsi1)) {
            analysisArr.push(FSD)
            //utils.appendfs(utils.getToday().dateStr + '-analysis.json',JSON.stringify(FSD)+'\n')
            html = html + str + ` <a href="${FSD.url}">${name}</a> <br>`
            let mdStr = `- [ ]  ${str} [${name}](${FSD.url}) \n`
            analysisMD = analysisMD + mdStr
            //utils.appendfs(utils.getToday().dateStr + '.md',mdStr)
            console.log(str + ` ${FSD.url}`);
        }
    },
    matchPrice: function (price) {
        if (this.requirePrice) {
            if ((price > this.priceMin) && (price < this.priceMax)) {
                return true
            } else {
                return false
            }
        } else {
            return true
        }
    },
    matchMACD: function (macd) {
        if (typeof (macd) === 'number') {
            if (this.requireMACD) {
                if ((macd > this.macdMin) && (macd < this.macdMax)) {
                    return true
                } else {
                    return false
                }
            } else {
                return true
            }
        } else {
            return false
        }
    },
    includeST: function (name) {
        if (this.STinclude === false) {
            if (name.indexOf("ST") === -1) {
                return true
            } else {
                return false
            }
        } else {
            return true
        }
    },
    matchKDJ: function (kdjk, kdjd, kdjj) {
        if (this.requireKDJ) {
            if (kdjk < this.k && kdjd < this.d && kdjj < this.j) {
                return true
            } else {
                return false
            }
        } else {
            return true
        }
    },
    matchRSI: function (rsi1) {
        if (this.requireRSI) {
            if (rsi1 <= this.rsi) {
                return true
            } else {
                return false
            }
        } else {
            return true
        }
    }
}
var utils = {
    getToday: function () {
        let date = new Date()
        let dateStr = `${date.getMonth()+1}-${date.getDate()}`
        let timeStamp = Math.round(date)
        return {
            'timeStamp': timeStamp,
            'dateStr': dateStr
        }
    },
    sleep: function (ms) {
        return new Promise((resolve, rej) => {
            setTimeout(() => {
                resolve()
            }, ms);
        });
    },
    appendfs: function (fsName, str) {
        fs.appendFile(fsName, str, function (err) {
            if (err) {
                return console.error(err);
            }
        });
    },
    writefs: function (fsPath, str) {

        fs.writeFile(fsPath, str, function (err) {
            if (err) {
                return console.error(err);
            }
        });
    },
}
var fsName = {
    dateJSON: path.format({
        dir: `${interceptor.fileDir}/${utils.getToday().dateStr}`,
        name: `${utils.getToday().dateStr}`,
        ext: '.json'
    }),
    dataHtml: path.format({
        dir: `${interceptor.fileDir}/${utils.getToday().dateStr}`,
        name: `${utils.getToday().dateStr}`,
        ext: '.html'
    }),
    dateAnalysisMD: path.format({
        dir: `${interceptor.fileDir}/${utils.getToday().dateStr}`,
        name: `${utils.getToday().dateStr}`,
        ext: '.md'
    }),
    dateAnalysisJSON: path.format({
        dir: `${interceptor.fileDir}/${utils.getToday().dateStr}`,
        name: `${utils.getToday().dateStr}-analysis`,
        ext: '.json'
    })
}
var fetchBar = new ProgressBar.Bar({
    'stopOnComplete': true
}, ProgressBar.Presets.shades_classic);
var chosenList = []
var analysisMD = ''
var analysisArr = []
var html = ''
var mailAttachment = []
var headers = {
    'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36`,
};
//获取随机数量的股票
function getRandomArrElement(arr, eleCount) {
    let count = arr.length;
    let result = []
    if ((eleCount >= count) || (eleCount === 'ALL')) {
        for (var i = 0; i < count; i++) {
            var index = ~~(Math.random() * count) + i;
            result[i] = arr[index];
            arr[index] = arr[i];
            count--;
        }
    } else {
        for (let i = 0; i < eleCount; i++) {
            let index = ~~(Math.random() * count) + i;
            result[i] = arr[index];
            arr[index] = arr[i];
            count--;
        }
    }
    return result
}
//获取所有股票
function getStockId() {
    return new Promise(function (resolve, reject) {
        let opt = {
            url: 'http://api.k780.com/?app=finance.stock_list&category=hs&appkey=10003&sign=b59bc3ef6191eb9f747dd4e83c99f2a4&format=json',
            method: 'GET',
            headers: headers,
        }
        request(opt, (err, resp, body) => {
            if (resp.statusCode === 200) {
                var allList = JSON.parse(body).result.lists;
                chosenList = getRandomArrElement(allList, interceptor.stockCount)
                //console.log(chosenList);
                fetchBar.start(chosenList.length, 0);
                resolve(chosenList)
            } else {
                reject(resp.statusCode)
            }
        })
    })
}
//设置cookie
function getCookie() {
    return new Promise((resolve, reject) => {
        let xueqiuopt = {
            url: 'http://xueqiu.com',
            method: 'GET',
            headers: headers,
        }
        request(xueqiuopt, (err, resp, body) => {
            if (resp.statusCode === 200) {
                resolve(resp.headers['set-cookie'])
            } else {
                reject()
            }
        })
    })
}
//获取单支股票数据
function getStockDataP(stock, index, cookie) {
    //console.log(stock);
    return new Promise(function (resolve, reject) {
        stockName = stock.sname
        stockCode = stock.symbol.toUpperCase()
        stockDataOpts = {
            url: `https://stock.xueqiu.com/v5/stock/chart/kline.json?symbol=${stockCode}&begin=${utils.getToday().timeStamp}&period=day&type=before&count=${interceptor.days}&indicator=kline,ma,macd,kdj,boll,rsi,wr,bias,cci,psy`,
            method: 'GET',
            headers: {
                'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36`,
                Cookie: cookie, //这里是登陆后得到的cookie,(重点)
            }
        }
        request(stockDataOpts, (err, resp, body) => {
            //console.log(err);
            if (!err) {
                if (resp.statusCode === 200) {
                    let respData = JSON.parse(body)
                    if (respData.data.item) {
                        respData.data.sName = stockName
                        //fsName = utils.getToday().dateStr + '.json'
                        utils.appendfs(fsName.dateJSON, JSON.stringify(respData) + '\n')
                        resolve(body)
                    }
                } else {
                    reject(resp.statusCode)
                }
            } else {
                reject(err)
            }
        })
    })
}

function getStockData(stock, index, cookie) {
    return Promise.race([
        getStockDataP(stock, index, cookie),
        new Promise(function (resolve, reject) {
            setTimeout(() => reject(new Error(`${stock.sname} request timeout`)), 2000)
        })
    ]);
}
//asyncForEach
async function asyncForEach(arr, callback) {
    //const O = Object(arr);
    let index = 0;
    while (index < arr.length) {
        //const kValue = arr[k];
        await callback(arr[index], index);
        index++;
    }
}

function formatedStockData(stockData) {
    var FSD = {}
    FSD.code = stockData.symbol
    FSD.name = stockData.sName
    stockData.column.forEach((e, i) => {
        FSD[e] = stockData.item[0][i]
    })
    return FSD
}
//分析数据
function analysis(fsPath) {
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
        let data = json.data
        if (data.symbol) {
            interceptor.interceptor(data)
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
        console.log(`    Anaysis end`);
    });
}
async function sendMail() {
    let mailOptions
    await fs.readFile(path.format({
        dir: interceptor.fileDir,
        name: 'mailAccount',
        ext: '.json'
    }), (err, data) => {
        let mailInfo = JSON.parse(data)
        let transporter = nodemailer.createTransport(
            mailInfo.accountInfo
        );
        mailOptions = {
            from: mailInfo.mail.from,
            to: mailInfo.mail.to,
            subject: `${utils.getToday().dateStr} 分析报告`,
            html: `
            ${html}
              `,
            attachments: mailAttachment
        };
        transporter.sendMail(mailOptions)
    })
}
async function fetchAllAndAnalysis(chosenList, cookie) {
    if (interceptor.fetchTodayData) {
        await asyncForEach(chosenList, async (ele, index) => {
            await utils.sleep(Math.random() * interceptor.interval) // 增加时延，防止被封ip
            await getStockData(ele, index, cookie).then((body) => {
                //console.log(body);
            }, (err) => {
                //console.log(err);
            })
            fetchBar.update(index + 1);
        });
        mailAttachment.push({
            filename: fsName.dateJSON,
            path: fsName.dateJSON
        })
        fs.readFile(path.format({
            dir: interceptor.fileDir,
            name: 'Templete',
            ext: '.html'
        }), 'utf8', (err, data) => {
            html = data
            fs.readFile(fsName.dateJSON, 'utf8', (err, json) => {
                fs.writeFile(fsName.dataHtml, html.replace('DATADATA', json), () => {
                    mailAttachment.push({
                        filename: fsName.dataHtml,
                        path: fsName.dataHtml
                    })
                })
            })
        })
    }
    fetchBar.stop()
    await utils.sleep(Math.random() * 1000)
    if (interceptor.analysis) {
        console.log('  Start analysis \n');
        mailAttachment.push({
            filename: fsName.dateAnalysisMD,
            path: fsName.dateAnalysisMD
        })
        mailAttachment.push({
            filename: fsName.dateAnalysisJSON,
            path: fsName.dateAnalysisJSON
        })
        analysis(fsName.dateJSON)
    } else {
        console.log('No need for analysis progress end now ')
    }
    await utils.sleep(Math.random() * 1000)
    if (interceptor.mailNotify) {
        sendMail()
        console.log(`    Sending Mail`);
    } else {
        console.log(`    Don't need to send mail`);
    }
};
!(function () {
    fs.rmdir(`${__dirname}/${utils.getToday().dateStr}`, () => {
        fs.mkdir(`${__dirname}/${utils.getToday().dateStr}`, () => {
            getStockId().then((chosenList) => {
                getCookie().then((cookie) => {
                    fetchAllAndAnalysis(chosenList, cookie)
                })
            })
        })
    })


})()