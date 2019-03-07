var request = require('request')
var utils = require('./utils')
var config = require('../config/config')

var headers = {
    'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36`,
};

//获取所有股票
function getAllStockId() {
    return new Promise(function (resolve, reject) {
        let opt = {
            url: 'http://api.k780.com/?app=finance.stock_list&category=hs&appkey=10003&sign=b59bc3ef6191eb9f747dd4e83c99f2a4&format=json',
            method: 'GET',
            headers: headers,
        }
        request(opt, (err, resp, body) => {
            if (resp.statusCode === 200) {
                var allList = JSON.parse(body).result.lists;
                resolve(allList)
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
function getStockDataP(stock, cookie) {
    //console.log(stock);
    return new Promise(function (resolve, reject) {
        stockName = stock.sname
        stockCode = stock.symbol.toUpperCase()
        stockDataOpts = {
            url: `https://stock.xueqiu.com/v5/stock/chart/kline.json?symbol=${stockCode}&begin=${utils.getToday().timeStamp}&period=day&type=before&count=${config.days}&indicator=kline,ma,macd,kdj,boll,rsi,wr,bias,cci,psy`,
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
                        resolve(respData.data)
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


function getStockData(stock, cookie) {
    return Promise.race([
        getStockDataP(stock, cookie),
        new Promise(function (resolve, reject) {
            setTimeout(() => reject(new Error(`${stock.sname} request timeout`)), 1000)
        })
    ]);
}



module.exports = {
    allStockArr: getAllStockId,
    setCookie: getCookie,
    getStockData: getStockData,
}