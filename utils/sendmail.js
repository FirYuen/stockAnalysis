var mailConfig = require("../config/mailconfig")
var dateStr = require("./utils").getToday().dateStr
var nodemailer = require("nodemailer");

function sendMail(mailConfig) {

    let transporter = nodemailer.createTransport(
        mailConfig.accountInfo
    );
    let mailOptions = {
        from: mailConfig.mail.from,
        to: mailConfig.mail.to,
        subject: `${dateStr} 分析报告`,
        text: mailConfig.text,
        // html: mailConfig.html,
        attachments: mailConfig.mailAttachment
    };
    transporter.sendMail(mailOptions)
}
module.exports = {
    sendMail: sendMail
}