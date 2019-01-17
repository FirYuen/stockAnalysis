var request = require('request')
var fs = require("fs")
var ProgressBar = require('cli-progress');
var readLine = require('lei-stream').readLine;
var nodemailer = require("nodemailer");

var interceptor = {
    analysis: true,
    fetchTodayData: true,
    k: 25,
    d: 25,
    j: 25,
    macdMin: -0.6,
    macdMax: 0.00,
    priceMin: 4.00,
    priceMax: 80.00,
    requireMACD: true,
    requireKDJ: true,
    requirePrice: true,
    STinclude: false,
    days: -1,
    stockCount: 'ALL',//'ALL' //接受number 或者 字符串 ALL
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
            kdjj
        } = FSD
        FSD.url = 'https://xueqiu.com/S/' + code
        let str = `${code} ${name} 价格: ${open} 涨跌: ${percent} ${macd} ${kdjk} ${kdjd} ${kdjj}`
        if (this.matchMACD(macd) & this.matchPrice(open) & this.includeST(name) & this.matchKDJ(kdjk, kdjd, kdjj)) {
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
            if ((price > this.priceMin) & (price < this.priceMax)) {
                return true
            } else {
                return false
            }
        } else {
            return true
        }
    },
    matchMACD: function (macd) {
        if (typeof (macd) == 'number') {
            if (this.requireMACD) {
                if ((macd > this.macdMin) & (macd < this.macdMax)) {
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
        if (this.STinclude == false) {
            if (name.indexOf("ST") == -1) {

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
            if (kdjk < this.k & kdjd < this.d & kdjj < this.j) {
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
    writefs: function (fsName, str) {
        fs.writeFile(fsName, str, function (err) {
            if (err) {
                return console.error(err);
            }
        });
    },

}

var fsName = {
    dateJSON: utils.getToday().dateStr + '.json',
    dateAnalysisMD: utils.getToday().dateStr + '.md',
    dateAnalysisJSON: utils.getToday().dateStr + '-analysis.json'
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
        for (var i = 0; i < eleCount; i++) {
            var index = ~~(Math.random() * count) + i;
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
function getStockData(stock, index, cookie) {
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
            if (resp.statusCode === 200) {
                let respData = JSON.parse(body)
                respData.data.sName = stockName
                //fsName = utils.getToday().dateStr + '.json'
                utils.appendfs(fsName.dateJSON, JSON.stringify(respData) + '\n')
                resolve()
            } else {
                reject()
            }
        })
    })
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
};

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
function analysis(fsName) {
    let line = readLine(fs.createReadStream(fsName), {
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
        utils.writefs(utils.getToday().dateStr + '.md', analysisMD)
        let analysisJSON = {}
        analysisArr.forEach((e, i) => {
            analysisJSON[i] = e
        });
        utils.writefs(utils.getToday().dateStr + '-analysis.json', JSON.stringify(analysisJSON))
        console.log(`    Anaysis end`);
    });
}




async function sendMail() {
    let mailOptions
    await fs.readFile("mailAccount.json", (err, data) => {
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
            await utils.sleep(Math.random() * 500) // 增加时延，防止被封ip
            await getStockData(ele, index, cookie)
            fetchBar.update(index + 1);
        });
        mailAttachment.push({
            filename: fsName.dateJSON,
            path: fsName.dateJSON
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
    sendMail()
    
    

};

!(function () {
    getStockId().then((chosenList) => {
        getCookie().then((cookie) => {
            fetchAllAndAnalysis(chosenList, cookie)
        })
    })
})()