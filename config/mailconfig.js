var fsName = require('./config').fsName
module.exports = {
    accountInfo: {
        host: "smtp.163.com",
        port: 465,
        secure: true,
        auth: {
            user: "yuenwork@163.com",
            pass: "*"
        }
    },
    mail: {
        from: "yuenwork@163.com",
        to: "yuenwork@163.com"
    },
    text: "",
    mailAttachment: [
        //     {
        //     filename: fsName.dataHtml,
        //     path: fsName.dataHtml
        // }, 
        {
            filename: fsName.dateJSON,
            path: fsName.dateJSON
        }
    ]
}