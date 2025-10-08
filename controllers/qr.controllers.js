const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { verifyTokenWithErrorHandling } = require('../helpers/general_helper');
const { upload } = require('../helpers/general_helper');
const fs = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');

const actions = {}

actions.generarToken = async (req, res) => {
    const {tk} = req.query;
      try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
            QRCode.toDataURL(payload.id, function (err, url) {
              if (err) {
                res.json({ error: 1, message: "Error al generar qr" });
              }
              res.send(`<img src="${url}" alt="Código QR">`);
            });
        }else{
          res.json({ error: 1, message: "Token requerido" });
        }
      } catch (error) {
        console.log(error);
        if (error.message === 'TOKEN_EXPIRED') {
          return res.json({ error: 1, message: "Token expirado" });
        } else if (error.message === 'INVALID_TOKEN') {
          return res.json({ error: 1, message: "Token inválido" });
        } else {
          return res.json({ error: 1, message: "Error al confirmar usuario" });
        }
      }
}

module.exports = actions