import nodemailer from "nodemailer";

/**
 * Configure Nodemailer Transporter using Gmail SMTP credentials
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "virdamahavir7@gmail.com",
    pass: process.env.SMTP_PASS || "cwptibeduvezrusf",
  },
});

/**
 * Send password reset OTP email to employee
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6 digit OTP
 */
export const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"PeoplePay360 Security" <${process.env.SMTP_USER || "virdamahavir7@gmail.com"}>`,
    to: toEmail,
    subject: "Your PeoplePay360 Password Reset Code",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .logo { display: inline-block; background-color: #0f766e; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px; }
          .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 8px; }
          .text { font-size: 14px; color: #475569; line-height: 1.6; margin: 8px 0; }
          .otp-box { background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f766e; font-family: monospace; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">PeoplePay360</div>
          <h2 class="title">Password Reset Verification</h2>
          <p class="text">Hello,</p>
          <p class="text">We received a request to reset your password for your PeoplePay360 account. Use the one-time verification code below to proceed:</p>
          
          <div class="otp-box">
            <span class="otp-code">${otp}</span>
          </div>

          <p class="text">This code will expire in <strong>10 minutes</strong>. If you did not request this password reset, please ignore this email or notify your system administrator.</p>
          
          <div class="footer">
            &copy; ${new Date().getFullYear()} PeoplePay360 HR & Payroll System. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

export default {
  transporter,
  sendOtpEmail,
};
