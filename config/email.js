import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: 'ecoartteampi@gmail.com',
    pass: 'zwsb opga qbas fwnl'
  }
});

export default transporter;
