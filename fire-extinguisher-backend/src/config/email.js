const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOTPEmail(toEmail, otp, type) {
  const isReset = type === 'PASSWORD_RESET';
  const subject = isReset
    ? 'TZW LTD — Password Reset OTP'
    : 'TZW LTD — Email Verification OTP';
  const body = isReset
    ? `Dear User, your password reset OTP is: ${otp}. 
It expires in 10 minutes. 
If you did not request this, ignore this email.`
    : `Dear User, your email verification OTP is: ${otp}. 
It expires in 10 minutes. 
Enter this OTP to activate your account.`;

  await transporter.sendMail({
    from: `"TZW LTD Fire Safety" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    text: body
  });
}

module.exports = { sendOTPEmail };
