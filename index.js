var fs = require("fs")
var path = require("path")
var mongoose = require("mongoose")
//-----------------
//连接数据库
var db = require('./config/config').mongoURI
var dateData = require("./models/dateData")
mongoose.connect(db, { useNewUrlParser: true })
    .then((client) => {
        console.log('MongoDB Connected');
    })
    .catch(err => console.log(err))
//-----------------
var {
    allStockArr,
    setCookie,
    getStockData,
} = require("./utils/http")
var utils = require("./utils/utils")
var interceptor = require("./config/interceptor")
var config = require("./config/config")
var dateStr = utils.getToday().dateStr
var fsName = config.fsName
var mailconfig = require("./config/mailconfig")
var sendmail = require("./utils/sendmail").sendMail
var analysis = require("./utils/analysis").analysis

async function getDataAndsaveToDataBase(stock, cookie) {
    try {
        let filed = utils.formatedStockData(await getStockData(stock, cookie))
        //判断是不是当天的数据
        let todayTimestamp = new Date(new Date().toLocaleDateString()).getTime()
        console.log(filed.data.timestamp, todayTimestamp)
        if (config.onlyTodayData) {
            if (filed.data.timestamp === todayTimestamp) {
                await dateData(filed).save()
                await utils.appendfs(fsName.dateJSON, JSON.stringify(filed) + '\n')
            }
        } else {
            await dateData(filed).save()
            await utils.appendfs(fsName.dateJSON, JSON.stringify(filed) + '\n')
        }
    } catch (err) {
        console.log(err)
    }
}

async function asyncForEach(arr, callback) {
    //const O = Object(arr);
    let index = 0;
    while (index < arr.length) {
        //const kValue = arr[k];
        await callback(arr[index], index);
        index++;
    }
}

async function fetchDataAndStorage() {
    let cookie = await setCookie()
    let allList = await allStockArr()
    let chosenList = utils.getRandomArrElement(allList, config.stockCount)
    if (config.fetchTodayData) {
        await asyncForEach(chosenList, async (ele, index) => {
            await utils.sleep(Math.random() * config.interval) // 增加时延，防止被封ip
            await getDataAndsaveToDataBase(ele, cookie)
        })
    }
}



function createHtmlFile() {
    fs.readFile(path.format({
        dir: `${__dirname}/storage/`,
        name: 'Templete',
        ext: '.html'
    }), 'utf8', (err, data) => {
        let html = data
        fs.readFile(fsName.dateJSON, 'utf8', (err, json) => {
            fs.writeFile(fsName.dataHtml, html.replace('DATADATA', json), () => {
                //mailconfig.html = data //设置邮件正文
            })
        })
    })
}



!(async () => {
    if (fs.existsSync(config.fileDir)) {
        await utils.rmdir(config.fileDir, () => {
            fs.mkdir(config.fileDir, () => {})
        });
    } else {
        await fs.mkdir(config.fileDir, () => {})
    }

    await fetchDataAndStorage();


    await createHtmlFile();

    await utils.sleep(Math.random() * 1000)
    if (config.analysis) {
        console.log('  Start analysis \n');
        mailconfig.mailAttachment.push({
            filename: fsName.dateAnalysisMD,
            path: fsName.dateAnalysisMD
        })
        mailconfig.mailAttachment.push({
            filename: fsName.dateAnalysisJSON,
            path: fsName.dateAnalysisJSON
        })
        console.log(fsName.dateJSON)
        console.log(path.basename(fsName.dateJSON))
        await analysis(fsName.dateJSON) //return str 为邮件正文

    } else {
        console.log('No need for analysis progress end now ')
    }
    await utils.sleep(Math.random() * 1000)
    if (config.mailNotify) {
        fs.readFile(fsName.mailText, (err, data) => {
            mailconfig.text = data
            sendmail(mailconfig)
        })

        console.log(`    Sending Mail`);
    } else {
        console.log(`    Don't need to send mail`);
    }
    await mongoose.disconnect()
})()