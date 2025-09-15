import nodemailer from "nodemailer";
import { quietHoursTemplate } from "./emailTemplate";

export const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.GMAIL_EMAIL,      
    pass: process.env.GMAIL_PASSWORD,  
  },
});

export const sendQuietHoursEmail = async (to: string, startTime: string, endTime: string) => {
  return transporter.sendMail({
    from: process.env.GMAIL_EMAIL,  
    to,
    subject: "Upcoming Quiet Hours in 10 Minutes",
    html: quietHoursTemplate(startTime, endTime),
  });
};
