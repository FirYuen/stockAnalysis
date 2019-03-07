var fs = require('fs')
var path = require("path")

module.exports = {
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
    rmdir: function (dir, callback) {
        fs.readdir(dir, (err, files) => {

            function next(index) {
                // 如果index 等于当前files的时候说明循环遍历已经完毕，可以删除dir，并且调用callback
                if (index === files.length) return fs.rmdir(dir, callback)
                // 如果文件还没有遍历结束的话，继续拼接新路径，使用fs.stat读取该路径
                let newPath = path.join(dir, files[index])
                // 读取文件，判断是文件还是文件目录

                fs.stat(newPath, (err, stat) => {
                    if (stat.isDirectory()) {
                        // 因为我们这里是深度循环，也就是说遍历玩files[index]的目录以后，才会去遍历files[index+1]
                        // 所以在这里直接继续调用rmdir，然后把循环下一个文件的调用放在当前调用的callback中
                        rmdir(newPath, () => next(index + 1))
                    } else {
                        // 如果是文件，则直接删除该文件，然后在回调函数中调用遍历nextf方法，并且index+1传进去
                        fs.unlink(newPath, () => next(index + 1))
                    }
                })
            }
            next(0)
        })
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
    //获取随机数量的股票
    getRandomArrElement: function (arr, eleCount) {
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
    },
    formatedStockData: function (stockData) {
        let FSD = { data: {} }
        FSD.code = stockData.symbol
        FSD.name = stockData.sName
        stockData.column.forEach((e, i) => {
            FSD.data[e] = stockData.item[0][i]
        })
        return FSD
    }

}