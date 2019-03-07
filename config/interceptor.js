var path = require('path');


module.exports = {

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

    interceptor: function (data) {
        let FSD = data; //this.formatedStockData(data)
        let {
            code,
            name,
        } = FSD
        let {

            timestamp,
            open,
            percent,
            macd,
            kdjk,
            kdjd,
            kdjj,
            rsi1
        } = FSD.data

        if (this.matchMACD(macd) && this.matchPrice(open) && this.includeST(name) && this.matchKDJ(kdjk, kdjd, kdjj) && this.matchRSI(rsi1)) {
            FSD.url = 'https://xueqiu.com/S/' + code
            let str = `${code} ${name} 价格: ${open} 涨跌: ${percent} ${macd} ${kdjk} ${kdjd} ${kdjj} ${rsi1} ${FSD.url} \n`
            //utils.appendfs(utils.getToday().dateStr + '-analysis.json',JSON.stringify(FSD)+'\n')
            //html = html + str + ` <a href="${FSD.url}">${name}</a> <br>`
            let mdStr = `- [ ]  ${str} [${name}](${FSD.url}) \n`
            //analysisMD = analysisMD + mdStr
            return { FSD, str, mdStr }
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
    },
    formatedStockData: function (stockData) {
        let FSD = {}
        FSD.code = stockData.symbol
        FSD.name = stockData.sName
        stockData.column.forEach((e, i) => {
            FSD[e] = stockData.item[0][i]
        })
        return FSD
    }
}