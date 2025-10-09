const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const path = require('path');

const PORT = process.env.PORT || 3000;

const app = express();
app.set('trust proxy', 1);
const uploadsDir = path.join(__dirname, 'uploads'); 
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000'], // Especifica el dominio permitido
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
  credentials: true // Permitir envío de cookies y credenciales
}));

app.use(session({
  secret: 'ternuriamigosforever',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 365 } 
}));
app.use(bodyParser.json());

app.use('/uploads', express.static(uploadsDir)); 

const users = require('./routers/user.router');
const plaza = require('./routers/plaza.router');
const qr = require('./routers/qr.router');
const reportes = require('./routers/reportes.router');
app.use('/api/users',users);
app.use('/api/plaza',plaza);
app.use('/api/qr',qr);
app.use('/api/reportes',reportes);

app.get("/api", (req, res) => {
  res.json({ message: "Hola desde el servidor!" });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto: ${PORT}`);
});
