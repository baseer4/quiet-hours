import nodemailer from "nodemailer";
import { quietHoursTemplate } from "./emailTemplate";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,          
  secure: true,      
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD, 
  },
  connectionTimeout: 20000,
});

export const sendQuietHoursEmail = async (to: string, startTime: string, endTime: string) => {
  return transporter.sendMail({
    from: process.env.GMAIL_EMAIL,  
    to,
    subject: "Upcoming Quiet Hours in 10 Minutes",
    html: quietHoursTemplate(startTime, endTime),
  });
};
