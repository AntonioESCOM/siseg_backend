const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
let cachedTransporter;

/**
 * Crea/recupera un transporter único (evita recrearlo en hot-reload).
 */
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
  } = process.env;

  cachedTransporter =
     nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
        auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      });

  return cachedTransporter;
}

/**
 * Envía un correo simple (HTML/Text/Adjuntos).
 * @param {{to:string, subject:string, html?:string, text?:string, from?:string, attachments?:Array}} opts
 */
async function sendEmail(opts) {
  const transporter = getTransporter();
  const mailOptions = {
    from: opts.from || process.env.MAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    attachments: opts.attachments, // [{ filename, path|content|buffer }]
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  };
}

const verifyTokenWithErrorHandling = (token, secretKey) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('INVALID_TOKEN');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('TOKEN_NOT_ACTIVE');
    } else {
      throw new Error('TOKEN_ERROR');
    }
  }
};
module.exports = { getTransporter, sendEmail,verifyTokenWithErrorHandling };