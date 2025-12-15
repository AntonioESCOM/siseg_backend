const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
let cachedTransporter;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { tk,nombre} = req.query;
    if (tk) {
      try {
        const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
        const userDir = path.join(__dirname, '../uploads', payload.id.toString()); 
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir); 
      } catch (error) {
        cb(error);
      }
    } else {
      cb(new Error('Token requerido'));
    }
  },
  filename: (req, file, cb) => {
    const { tk,nombre } = req.query; 
    if (nombre) {
      const ext = path.extname(file.originalname);
      cb(null, nombre + ext);
    } 
  }
});
const upload = multer({ storage: storage });

const tokenStore = new Map(); // Almacén en RAM
function createOneTimeToken(data, minutes = 15) {
    const token = crypto.randomBytes(32).toString('hex');
    tokenStore.set(token, {
        data,
        expires: Date.now() + (minutes * 60 * 1000)
    });
    return token;
}

/**
 * Valida, recupera los datos y ELIMINA el token (se quema).
 * Retorna null si es inválido o expiró.
 */
function consumeOneTimeToken(token) {
    if (!tokenStore.has(token)) return null;

    const record = tokenStore.get(token);
    
    // Validar expiración (por si el Garbage Collector no ha pasado aún)
    if (Date.now() > record.expires) {
        tokenStore.delete(token);
        return null;
    }

    // BORRAR EL TOKEN (Aquí ocurre la magia de un solo uso)
    tokenStore.delete(token);
    
    return record.data;
}

// Limpieza automática de memoria (Garbage Collector simple)
// Se ejecuta cada 5 minutos para borrar tokens viejos que nadie usó
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of tokenStore.entries()) {
        if (now > value.expires) {
            tokenStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

function splitName(nombreCompleto) {
  // 1. Inicialización y limpieza
  if (!nombreCompleto) return { nombre: '', apellidoP: '', apellidoM: '' };
  
  const partes = nombreCompleto.trim().split(/\s+/);
  const total = partes.length;
  
  // Palabras conectoras (preposiciones/artículos comunes en apellidos)
  const conectores = ['DA', 'DE', 'DEL', 'LA', 'LAS', 'LOS', 'SAN', 'SANTA', 'VON', 'VAN', 'Y', 'MC'];

  let index = 0;

  // --- FUNCIÓN HELPER INTERNA PARA CONSUMIR UN APELLIDO ---
  // Consume palabras hasta encontrar un sustantivo (algo que no sea conector)
  const consumirApellido = () => {
      let partesApellido = [];
      
      while (index < total) {
          const palabra = partes[index];
          partesApellido.push(palabra);
          index++;
          
          // Si la palabra actual NO es un conector, hemos encontrado el "núcleo" del apellido.
          // Ej: "DE" (sigue) -> "LA" (sigue) -> "CRUZ" (stop)
          if (!conectores.includes(palabra.toUpperCase())) {
              break;
          }
      }
      return partesApellido.join(' ');
  };

  // --- PASO 1: APELLIDO PATERNO ---
  // Siempre asumimos que lo primero es el Paterno
  const apellidoP = consumirApellido();

  // --- PASO 2: APELLIDO MATERNO ---
  let apellidoM = '';
  
  // Solo intentamos buscar materno si sobran al menos 2 palabras (1 para Mat + 1 para Nombre)
  // O si sobran palabras y decidimos que no tiene nombre (caso raro, pero posible en listas sucias)
  // REGLA: Si solo queda 1 palabra, asumimos que es el NOMBRE, no el apellido materno.
  if (index < total - 1) { 
      apellidoM = consumirApellido();
  } else if (index < total && total === 2) {
      // Caso especial: "PEREZ JUAN" (Total 2)
      // PEREZ ya es Paterno. Queda "JUAN".
      // En México es más probable que sea Paterno + Nombre que Paterno + Materno sin nombre.
      // Dejamos apellidoM vacío y dejamos que "JUAN" caiga en nombres.
  }

  // --- PASO 3: NOMBRES ---
  // Todo lo que sobró es el nombre
  const nombre = partes.slice(index).join(' ');

  return { nombre, apellidoP, apellidoM };
}
function isValidEmail(email) {
  const re = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return re.test(email);
}

function isValidCURP(curp) {
  if (!curp) return false;
  const c = curp.toString().trim().toUpperCase();
  const re = /^[A-Z]{1}[AEIOUX]{1}[A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$/;
  return re.test(c);
}
function isValidPeriodo(periodo) {
  if (!periodo) return false;
  const p = periodo.toString().trim().toUpperCase();
  const re = /^[A-Z]+\s+\d{4}\s+-\s+[A-Z]+\s+\d{4}$/;
  if (!re.test(p)) return false;
  return true;
}

module.exports = { getTransporter, sendEmail,verifyTokenWithErrorHandling,upload,createOneTimeToken,consumeOneTimeToken,splitName,isValidEmail,isValidCURP,isValidPeriodo };