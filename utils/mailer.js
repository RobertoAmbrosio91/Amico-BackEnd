const nodemailer = require('nodemailer');
const express = require("express");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    // secure: Boolean(process.env.SMTP_SECURE),
    auth: {
        user: process.env.SMTP_FROM_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

/* exports.sendmail = async(to, subject, messageBody) => {
    const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
        to,
        subject,
        html: messageBody,
    };
    return await transporter.sendMail(mailOptions);
}; */

exports.sendmailUsingOptions = async (options={}) => {
    try{
        let mailOptions = {};
        mailOptions.from = `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_EMAIL_FROM}>`;

        if(!options.to) throw new Error("Email is empty");
        mailOptions.to = options.to;
        
        mailOptions.subject = options.subject;
        
        mailOptions.html = options.html;
        
        if(options.bcc){
            mailOptions.bcc = options.bcc;
        }else{
            if(process.env.SMTP_BBC_EMAIL){
                mailOptions.bcc = process.env.SMTP_BBC_EMAIL;
            }
        }
        return await transporter.sendMail(mailOptions);
    }catch(error){
        return error.message || "SMTP is not working";
    }
    
};

//send email to noosk@info.co for verification
exports.sendEmailDirectly = async (from,to, subject, messageBody) => {
  try {
    if (!to) throw new Error("Recipient email address is empty.");
    if (!subject) throw new Error("Email subject is empty.");
    if (!messageBody) throw new Error("Email message body is empty.");

    // Create the mail options directly
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
      to: to,
      subject: subject,
      html: messageBody,
    };

    // Use the transporter to send the mail
    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    // Handle any errors that occur
    console.error("Error sending email:", error);
    throw error; // Rethrow the error for further handling if necessary
  }
};



exports.readTemplate = async(filePath,data)=>{
    let app = express();
    
    return new Promise((resolve, reject)=>{
        app.render(__dirname + filePath,data,(err,html)=>{
            if(err){
                reject(err)
            }else{
                resolve(html);
            }
        });
    })
}
