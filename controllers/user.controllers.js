
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../helpers/general_helper');
const { verifyTokenWithErrorHandling } = require('../helpers/general_helper');
const fs = require('fs').promises;

const actions = {}


actions.loginUser = async (req, res) => {
    let { boleta, password } = req.body;

    try {
        const user = await prisma.Persona.findUnique({ where: { boleta } }); 
        if (user && user.contrasena ==password ) {
            const token = jwt.sign({ id: user.boleta, username: user.nobre},process.env.SECRET_KEY, {
                expiresIn: '1h' 
            });
          res.json({ error: 0, message: "Inicio de sesión exitoso", token });
        } else {
          res.json({ error: 1, message: "Credenciales incorrectas" });
    }
    } catch (error) {
      console.log(error);
      res.json({ error: 1, message: "Error al iniciar sesión" });
      
    }  
};

actions.verificarCandidato = async (req, res) => {
  let {email} = req.body;
  let correo=email;
  try {
    const user = await prisma.Persona.findUnique({ where: { correo } }); 
    if (user) {
        const token = jwt.sign({ id: user.boleta, username: user.nombre},process.env.SECRET_KEY, {expiresIn: '1h' });
        const verifyUrl = process.env.BASE_URL+`/confirm-email?tk=${token}`;
        let emailContent = await fs.readFile('./templates/confirmAccount.html', 'utf8');
        emailContent = emailContent.replace(/\$url/g, verifyUrl);
        await sendEmail({
          to: email,
          subject: 'Verificación de la cuenta',
          html: emailContent,
        });
        res.json({ error: 0, message: "Se ha enviado el link al email", verifyUrl});
    } else {
        res.json({ error: 1, message: "Correo no registrado como candidato" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: 1, message: "Error al verificar usuario" });
  }
}

actions.confirmarCandidato = async (req, res) => {
  const {tk } = req.query;
  try {
    if(tk){
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      await prisma.Alumno.update({ where: { boleta: payload.id }, data: {estatus:1} });
      res.json({ error: 0, message: "Se ha confirmado al usuario"});
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

actions.restablecerPasswordEmail = async (req,res) =>{
  let{email} = req.body;
  let correo=email;
  try {
    const user = await prisma.Persona.findUnique({ where: { correo } }); 
    if (user) {
        const token = jwt.sign({ id: user.boleta, username: user.nombre},process.env.SECRET_KEY, {expiresIn: '15m' });
        const verifyUrl = process.env.BASE_URL+`api/users/confirmarCandidato?tk=${token}`;
        let emailContent = await fs.readFile('./templates/recoverPasswordTemplate.html', 'utf8');
        emailContent = emailContent.replace(/\$url/g, verifyUrl);
        await sendEmail({
          to: email,
          subject: 'Restablecer Contraseña',
          html: emailContent,
        });
        res.json({ error: 0, message: "Se ha enviado el link al email", verifyUrl});
    } else {
        res.json({ error: 1, message: "Correo no registrado" });
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

actions.restablecerPassword = async (req, res) => {
  const {password,tk}  = req.body;
  try {
    if(tk){
      const payload =verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      console.log(payload.id,password);
      await prisma.Persona.update({ where: { boleta: payload.id }, data: {contrasena:password} })
      res.json({ error: 0, message: "Se ha restablecido la contraseña"});
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

actions.getValidarDatos = async(req,res)=>{
  const {tk} = req.query;
    try {
    if(tk){
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const user = await prisma.Persona.findUnique({ where: { boleta:payload.id } ,  include: {alumno: true} }); 
      const carrera = await prisma.CARRERA.findUnique({where:{ ID:user.alumno.carrera}});
      if (user) {
          const data= {
            boleta:user.boleta, 
            correo: user.correo,
            curp:user.curp,
            nombre:user.nombre,
            apellido_paterno:user.APELLIDO_PATERNO,
            apellido_materno:user.APELLIDO_MATERNO,
            generacion:user.alumno.generacion,
            promedio:user.alumno.promedio,
            carrera:carrera.NOMBRE
          };
          res.json({ error: 0, message: "Datos",data });
      } else {
          res.json({ error: 1, message: "Correo no registrado como candidato" });
      }
    }else{
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: 1, message: "Token expirado" });
  }
}

actions.completarRegistro =async (req,res) =>{
  const {tk,rfc,calle,colonia,delegacion,estado,cp,sexo,telcelular,tellocal}=req.body;
  try {
    if(rfc,calle,colonia,delegacion,estado,cp,sexo,telcelular,tellocal,tk){
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      await prisma.Persona.update({ where: { boleta: payload.id }, data: {sexo:sexo,telefonoMovil:telcelular,telefonoFijo:tellocal} });
      await prisma.Alumno.update({ where: { boleta: payload.id }, data: {rfc:rfc} });
      if( !await prisma.Direccion.findUnique({ where: { alumnoBoleta:payload.id }}))
        await prisma.Direccion.create({  data: {alumnoBoleta:payload.id,calle:calle,colonia:colonia,delegacionMunicipio:delegacion,cp:cp,estado:estado} });
      res.json({ error: 0, message: "Se ha completado el registro"});
    }else{
      res.json({ error: 1, message: "Faltan parametros en la petición" });
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
