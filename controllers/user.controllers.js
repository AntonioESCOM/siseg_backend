const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { sendEmail, isValidCURP } = require("../helpers/general_helper");
const { verifyTokenWithErrorHandling } = require("../helpers/general_helper");
const {createOneTimeToken} = require("../helpers/general_helper");
const {consumeOneTimeToken} = require("../helpers/general_helper");
const {splitName,isValidEmail,isValidPeriodo}= require("../helpers/general_helper");
const { upload } = require("../helpers/general_helper");
const fs = require("fs").promises;
const path = require("path");
const xlsx = require('xlsx');

const actions = {};

actions.loginUser = async (req, res) => {
  let { boleta, password } = req.body;

  try {
    const user = await prisma.Persona.findUnique({ where: { boleta } });
    const ok = await bcrypt.compare(password, user.contrasena);
    if (user && ok) {
      let token;
      if(user.rol == "ALUMNO"){
        const alumnoProfile = await prisma.Alumno.findUnique({ where: { boleta: user.boleta } });
        token = jwt.sign(
          { id: user.boleta, username: user.nombre, rol: user.rol, estatus: alumnoProfile.estatus },
          process.env.SECRET_KEY,
          {
            expiresIn: "1h",
          }
        );
      } else {
        const adminProfile = await prisma.PAdmin.findUnique({ where: { boleta: user.boleta } });
        token = jwt.sign(
          { id: user.boleta, username: user.nombre, rol: user.rol, perfil: adminProfile.perfil, estatus: adminProfile.estatus },
          process.env.SECRET_KEY,
          {
            expiresIn: "1h",
          }
        );
      }
      res.json({ error: 0, message: "Inicio de sesión exitoso", token });
    } else {
      res.json({ error: 1, message: "Credenciales incorrectas" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: 1, message: "Error al iniciar sesión" });
  }
};

actions.refreshToken = async (req, res) => {
  const { tk } = req.query;
  try {
    const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
    const user = await prisma.Persona.findUnique({ where: { boleta: payload.id } });
    if(user.rol == "ALUMNO"){
      const alumnoProfile = await prisma.Alumno.findUnique({ where: { boleta: user.boleta } });
      token = jwt.sign(
        { id: user.boleta, username: user.nombre, rol: user.rol, estatus: alumnoProfile.estatus },
        process.env.SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );
    } else {
      const adminProfile = await prisma.PAdmin.findUnique({ where: { boleta: user.boleta } });
      token = jwt.sign(
        { id: user.boleta, username: user.nombre, rol: user.rol, perfil: adminProfile.perfil, estatus: adminProfile.estatus },
        process.env.SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );
    }
    res.json({ error: 0, message: "Token renovado", token: token });
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.verificarCandidato = async (req, res) => {
  let { email } = req.body;
  let correo = email;
  try {
    const user = await prisma.Persona.findUnique({ where: { correo } });
    if (user) {
      const token = jwt.sign(
        { id: user.boleta, username: user.nombre },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
      );
      const verifyUrl = process.env.FRONT_END_URL + `/completar-registro?tk=${token}`;
      let emailContent = await fs.readFile(
        "./templates/confirmAccount.html",
        "utf8"
      );
      emailContent = emailContent.replace(/\$url/g, verifyUrl);
      await sendEmail({
        to: email,
        subject: "Verificación de la cuenta",
        html: emailContent,
      });
      res.json({
        error: 0,
        message: "Se ha enviado el link al email",
        verifyUrl,
      });
    } else {
      res.json({ error: 1, message: "Correo no registrado como candidato" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: 1, message: "Error al verificar usuario" });
  }
};

actions.confirmarCandidato = async (req, res) => {
  const { tk } = req.query;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      await prisma.Alumno.update({
        where: { boleta: payload.id },
        data: { estatus: 1 },
      });
      res.json({ error: 0, message: "Se ha confirmado al usuario" });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.restablecerPasswordEmail = async (req, res) => {
  let { email } = req.body;
  let correo = email;
  try {
    const user = await prisma.Persona.findUnique({ where: { correo } });
    if (user) {
      const token = createOneTimeToken({ id: user.boleta, username: user.nombre});
      const verifyUrl =
      process.env.FRONT_END_URL + `/nueva-contrasena?tk=${token}`;
       let emailContent = await fs.readFile(
        "./templates/recoverPasswordTemplate.html",
        "utf8"
      );
      emailContent = emailContent.replace(/\$url/g, verifyUrl);
      await sendEmail({
        to: email,
        subject: "Verificación de la cuenta",
        html: emailContent,
      });
      res.json({
        error: 0,
        message: "Se ha enviado el link al email",
        verifyUrl,
      });
    } else {
      res.json({ error: 1, message: "Correo no registrado" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.restablecerPassword = async (req, res) => {
  const { password, tk } = req.body;
  try {
    if (tk) {
      const payload = consumeOneTimeToken(tk);
      const hashedPassword = await bcrypt.hash(password, 10);

      const persona = await prisma.Persona.update({
        where: { boleta: payload.id },
        data: { contrasena: hashedPassword },
      });
      if (persona.rol == "ALUMNO") {
        console.log("alumno");
        await prisma.Alumno.update({
          where: { boleta: payload.id },
          data: { estatus: 1 },
        });
      }else {
        console.log("admin");
        await prisma.PAdmin.update({
          where: { boleta: payload.id },
          data: { estatus: 1 },
        });
      }
      res.json({ error: 0, message: "Se ha restablecido la contraseña" });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.restablecerPasswordLogin = async (req, res) => {
  const { password, tk } = req.body;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const hashedPassword = await bcrypt.hash(password, 10);

      const persona = await prisma.Persona.update({
        where: { boleta: payload.id },
        data: { contrasena: hashedPassword },
      });
      if (persona.rol == "ALUMNO") {
        console.log("alumno");
        await prisma.Alumno.update({
          where: { boleta: payload.id },
          data: { estatus: 1 },
        });
      }else {
        console.log("admin");
        await prisma.PAdmin.update({
          where: { boleta: payload.id },
          data: { estatus: 1 },
        });
      }
      res.json({ error: 0, message: "Se ha restablecido la contraseña" });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.getValidarDatos = async (req, res) => {
  const { tk } = req.query;
  try {
     const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
    if (tk) {
      const user = await prisma.Persona.findUnique({
        where: { boleta: payload.id },
        include: { alumno: true },
      });
      const carrera = await prisma.CARRERA.findUnique({
        where: { ID: user.alumno.carrera },
      });
      if (user ) {
        const data = {
          boleta: user.boleta,
          correo: user.correo,
          curp: user.curp,
          nombre: user.nombre,
          apellido_paterno: user.APELLIDO_PATERNO,
          apellido_materno: user.APELLIDO_MATERNO,
          generacion: user.alumno.generacion,
          promedio: user.alumno.promedio,
          carrera: carrera.NOMBRE,
        };
        res.json({ error: 0, message: "Datos", data });
      } else {
        res.json({ error: 1, message: "Correo no registrado como candidato" });
      }
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: 1, message: "Token expirado" });
  }
};

actions.completarRegistro = async (req, res) => {
  const {
    calle,
    colonia,
    cp,
    delegacion,
    estado,
    rfc,
    sexo,
    telcelular,
    tellocal,
    tk
  } = req.body;
  try {
    if (
      (rfc,
      calle,
      colonia,
      delegacion,
      estado,
      cp,
      sexo,
      telcelular,
      tellocal,
      tk)
    ) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      await prisma.Persona.update({
        where: { boleta: payload.id },
        data: { contrasena: hashedPassword, sexo: sexo, telefonoMovil: telcelular, telefonoFijo: tellocal },
      });
      await prisma.Alumno.update({
        where: { boleta: payload.id },
        data: { rfc: rfc },
      });
      if (
        !(await prisma.Direccion.findUnique({
          where: { alumnoBoleta: payload.id },
        }))
      )
        await prisma.Direccion.create({
          data: {
            alumnoBoleta: payload.id,
            calle: calle,
            colonia: colonia,
            delegacionMunicipio: delegacion,
            cp: cp,
            estado: estado,
          },
        });
        const user = await prisma.Persona.findUnique({ where: { boleta: payload.id } });
        const loginUrl = process.env.FRONT_END_URL + `/iniciar-sesion`;
        let emailContent = await fs.readFile(
          "./templates/sendCredentials.html",
          "utf8"
        );
        emailContent = emailContent.replace(/\$loginUrl/g, loginUrl);
        emailContent = emailContent.replace(/\$tempPassword/g, randomPassword);
        await sendEmail({
          to: user.correo,
          subject: "Credenciales de acceso",
          html: emailContent,
        });
      res.json({ error: 0, message: "Se ha completado el registro" });
    } else {
      res.json({ error: 1, message: "Faltan parametros en la petición" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.modificarDatos = async (req, res) => {
  const {
    calle,
    colonia,
    cp,
    delegacion,
    estado,
    sexo,
    telcelular,
    tellocal,
    tk
  } = req.body;
  try {
    if (
      (calle, colonia, delegacion, estado, cp, sexo, telcelular, tellocal, tk)
    ) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      await prisma.Persona.update({
        where: { boleta: payload.id },
        data: { sexo: sexo, telefonoMovil: telcelular, telefonoFijo: tellocal },
      });
      await prisma.Direccion.update({
        where: { alumnoBoleta: payload.id },
        data: {
          calle: calle,
          colonia: colonia,
          delegacionMunicipio: delegacion,
          cp: cp,
          estado: estado,
        },
      });
      res.json({ error: 0, message: "Se ha completado el registro" });
    } else {
      res.json({ error: 1, message: "Faltan parametros en la petición" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.obtenerTodosDatosAlumno = async (req, res) => {
  const { tk } = req.query;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const user = await prisma.Persona.findUnique({
        where: { boleta: payload.id },
        include: { alumno: true },
      });
      const carrera = await prisma.CARRERA.findUnique({
        where: { ID: user.alumno.carrera },
      });
      const direccion = await prisma.Direccion.findUnique({
        where: { alumnoBoleta: payload.id },
      });
      if (user && carrera && direccion) {
      const data = {
        boleta: user?.boleta || "",
        correo: user?.correo || "",
        curp: user?.curp || "",
        rfc: user?.alumno?.rfc || "",
        nombre: user?.nombre || "",
        apellido_paterno: user?.APELLIDO_PATERNO || "",
        apellido_materno: user?.APELLIDO_MATERNO || "",
        generacion: user?.alumno?.generacion || "",
        promedio: user?.alumno?.promedio || "",
        carrera: carrera?.NOMBRE || "",
        calle_y_numero: direccion?.calle || "",
        colonia: direccion?.colonia || "",
        delegacion: direccion?.delegacionMunicipio || "",
        estado: direccion?.estado || "",
        cp: direccion?.cp || "",
        sexo: user?.sexo || "",
        telcelular: user?.telefonoMovil || "",
        tellocal: user?.telefonoFijo || "",
      };
        res.json({ error: 0, message: "Datos", data });
      } else {
        res.json({ error: 1, message: "Usuario no encontrado" });
      }
    } else {
      res.json({ error: 1, message: "Hubo problema on alguno de los campos del perfil, por favor ponte en contacto con el administrador"});
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {  
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.expedienteDigital = async (req, res) => {
  const {boleta,tk} = req.query;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const documents = await prisma.Expediente.findMany({
        where: { alumnoBoleta: boleta },
      });

      for (let doc of documents) {
        if (doc.adminEncargado) {
          doc.adminEncargado = await prisma.Persona.findUnique({
            where: { boleta: doc.adminEncargado },
            select: { nombre: true, APELLIDO_PATERNO: true, APELLIDO_MATERNO: true }
          });
        } else {
          doc.adminEncargado = null; 
        }
      }

      res.json({ error: 0, message: "Datos", documents });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};



actions.subirArchivo = async (req, res) => {
  const { nombre,tk } = req.query;
  if (!tk) {
    return res.status(400).send({ message: "Token requerido" });
  }

  const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);

  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res
        .status(500)
        .send({ error: "Error al subir el archivo", details: err.message });
    }

    try {
      if (!req.file) {
        return res
          .status(400)
          .send({ message: "No se ha enviado ningún archivo" });
      }

    
      const nombreLogico = (nombre?.trim?.() || req.file.originalname).trim();
      const ruta = `${process.env.BASE_URL}/uploads/${payload.id}/${req.file.filename}`;

      // 1) Buscar si ya existe un expediente con el mismo alumnoBoleta + nombreArchivo
      const existente = await prisma.expediente.findFirst({
        where: {
          alumnoBoleta: payload.id,
          nombreArchivo: nombreLogico,
        },
      });

      let expediente;
      let message;

      if (existente) {
        expediente = await prisma.expediente.update({
          where: { ID: existente.ID },
          data: {
            estatus: 2,
            rutaArchivo: ruta,
            fechaRegistro: new Date(),
          },
        });
        message = "Archivo actualizado exitosamente";
      } else {
        expediente = await prisma.expediente.create({
          data: {
            alumnoBoleta: payload.id,
            fechaRegistro: new Date(),
            nombreArchivo: nombreLogico,
            estatus: 2,
            rutaArchivo: ruta,
          },
        });
        message = "Archivo creado exitosamente";
      }

      return res.status(200).send({
        message,
        file: req.file,
        expediente,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ error: "Error procesando el archivo", details: error.message });
    }
  });
};

actions.obtenerTodosDatosAdmin = async (req, res) => {
  const { tk } = req.query;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const user = await prisma.Persona.findUnique({
        where: { boleta: payload.id },
        include: { pAdmin: true },
      });
      if (user) {
        const data = {
          numempleado: user.boleta,
          correo: user.correo,
          curp: user.curp,
          nombre: user.nombre,
          apellido_paterno: user.APELLIDO_PATERNO,
          apellido_materno: user.APELLIDO_MATERNO,
          perfil: user.pAdmin.perfil,
          sexo: user.sexo,
          telcelular: user.telefonoMovil,
          tellocal: user.telefonoFijo,
        };
        res.json({ error: 0, message: "Datos", data });
      } else {
        res.json({ error: 1, message: "Usuario no encontrado" });
      }
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: 1, message: "Token expirado" });
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.obtenerPlazaAsignada = async (req, res) => {
  const { tk } = req.query;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const alumno = await prisma.Alumno.findUnique({
        where: { boleta: payload.id }
      });
      if (alumno) {
        const plaza = await prisma.Plaza.findUnique({where: { ID: alumno.sede }});
        res.json({ error: 0, message: "Datos", plaza });
      } else {
        res.json({ error: 1, message: "Usuario no encontrado" });
      }
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: 1, message: "Hubo un error en el servidor" });
  }
};


actions.obtenerkpis = async (req, res) => {
  const { tk } = req.query;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const alumnosRegistrados = await prisma.Alumno.count();
      const alumnosRealizandoSS = await prisma.Alumno.count({where: {estatus: 3 }});
      const reportesdeIncidencias = await prisma.Reporte.count({where: {estatus: 1 }});
      res.json({ error: 0, message: "Datos", alumnosRegistrados, alumnosRealizandoSS,reportesdeIncidencias });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }     
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.obtenerTodosAlumnos = async (req, res) => {
  const { tk } = req.query;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const alumnos = await prisma.Alumno.findMany({
        include: { persona: true, direccion: true},
      });
      for (let alumno of alumnos) {
        alumno.carrera = await prisma.CARRERA.findUnique({ where: { ID: alumno.carrera }, select: { NOMBRE: true } });
        alumno.estatus = await prisma.ESTATUS_ALUMNO.findUnique({ where: { ID: alumno.estatus }, select: { DESCRIPCION: true } });
      }
      const data = alumnos.map((alumno) => ({
        
        boleta: alumno.boleta,
        nombre: alumno.persona.nombre,
        apellido_paterno: alumno.persona.APELLIDO_PATERNO,
        apellido_materno: alumno.persona.APELLIDO_MATERNO,
        curp: alumno.persona.curp,
        rfc: alumno.rfc,
        correo: alumno.persona.correo,
        generacion: alumno.generacion,
        promedio: alumno.promedio,
        carrera: alumno.carrera,
        estatus: alumno.estatus,
        sexo: alumno.persona.sexo,
        telcelular: alumno.persona.telefonoMovil,
        tellocal: alumno.persona.telefonoFijo,
        sede: alumno.sede,
        calle_y_numero: alumno.direccion?.calle || "",
        colonia: alumno.direccion?.colonia || "",
        delegacion: alumno.direccion?.delegacionMunicipio || "",
        estado: alumno.direccion?.estado || "",
        cp: alumno.direccion?.cp || "",
      }));
      res.json({ error: 0, message: "Datos", data });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    } 
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.editarAlumno = async (req, res) => {
  const {
    apellido_materno,
    apellido_paterno,
    boleta,
    carrera,
    correo,
    curp,
    estatus,
    generacion,
    nombre,
    promedio,
    sexo,
    tk
  } = req.body;
  try { 
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const user = await prisma.Persona.update({
        where: { boleta: boleta },
        data: {
          correo: correo,
          curp: curp,
          nombre: nombre,
          APELLIDO_PATERNO: apellido_paterno,
          APELLIDO_MATERNO: apellido_materno,
          sexo: sexo
        },
      });
      const alumno = await prisma.Alumno.update({
        where: { boleta: boleta },
        data: {
          generacion: generacion,
          promedio: promedio,
          carrera: carrera, 
          estatus: estatus
        },
      });
      res.json({ error: 0, message: "Se ha editado al alumno", user, alumno });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    } 
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {  
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};

actions.desactivarAlumno = async (req, res) => {
  const { boleta, tk } = req.body;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const alumno = await prisma.Alumno.update({
        where: { boleta: boleta },
        data: { estatus: 0 },
      });
      res.json({ error: 0, message: "Se ha desactivado al alumno" });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    }
    else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    }
    else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }
  }
};  

actions.agregarAlumno = async (req, res) => {
  const {
    apellido_materno,
    apellido_paterno,
    boleta,
    carrera,
    correo,
    curp,
    estatus,
    generacion,
    nombre,
    promedio,
    tk
  } = req.body;
  try {
    if (tk,apellido_materno,apellido_paterno,boleta,carrera,correo,curp,estatus,generacion,nombre,promedio) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      if(await prisma.Persona.findUnique({ where: { boleta: boleta }}) != undefined){
        return res.json({ error: 1, message: "Boleta duplicada:"+ boleta });
      }
      if(await prisma.Persona.findUnique({ where: { correo: correo }}) != undefined){
        return res.json({ error: 1, message: "Correo duplicado:"+ correo });
      }
      if(await prisma.Persona.findUnique({ where: { curp: curp }}) != undefined){
        return res.json({ error: 1, message: "CURP duplicado:"+ curp });
      }
      const user = await prisma.Persona.create({
        data: {
          boleta: boleta,
          correo: correo,
          curp: curp,
          nombre: nombre,
          APELLIDO_PATERNO: apellido_paterno,
          APELLIDO_MATERNO:apellido_materno,
          rol: "ALUMNO"
        }
      });
      const alumno = await prisma.Alumno.create({
        data: {
          boleta: boleta,
          generacion: generacion,
          promedio: promedio,
          carrera: carrera,
          estatus: estatus
        }
      });
      res.json({ error: 0, message: "Se ha agregado al alumno", alumno });
    } else {
      res.json({ error: 1, message: "Faltan parámetros" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    }
    else {
      return res.json({ error: 1, message: "Error al confirmar usuario" });
    }   
  }
};
actions.cargarAlumnos = async (req, res) => {
    upload.single("file")(req, res, async (err) => {
        const { tk } = req.query; 
        if (err) {
          console.error("Multer Error:", err);
          return res.status(500).json({ 
              error: 1, 
              message: "Error al subir el archivo", 
              details: err.message 
          });
        }
        try {
            if (!tk) {
                if (req.file) fs.unlinkSync(req.file.path); 
                return res.json({ error: 1, message: "Token requerido" });
            }

            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
            if (!req.file) {
                return res.json({ error: 1, message: "Archivo Excel requerido" });
            }
            const filePath = req.file.path; 
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const alumnos = xlsx.utils.sheet_to_json(worksheet); 
            const errores = [];

            for (const alumno of alumnos) {
              if (alumno['10o'] === '10o' && alumno['CARRERA'] === 'CARRERA') {
                  continue; 
              }
              const matricula = alumno['10o'];
              if (!matricula || typeof matricula !== 'number' || matricula.toString().length < 10) {
                  errores.push({ alumno, error: "Boleta inválida: " + matricula });
                  continue;
              }
              const boleta = matricula.toString().trim();
              const nombre = (alumno['MCP'] || alumno['MCH']).toString().trim();
              const fullname = splitName(nombre);

              if(isValidEmail(alumno['CORREO'] )){
                const correo = (alumno['CORREO']).toString().trim();
              }else{
                errores.push({ alumno, error: "Correo inválido: " + alumno['CORREO'] });
                continue;
              }
              if(isValidCURP(alumno['CURP'] )){
                const curp = (alumno['CURP'] || '').toString().trim();
              }else{
                errores.push({ alumno, error: "CURP inválido: " + alumno['CURP'] });
                continue;
              }
              if(isValidPeriodo(alumno['PROMOCIÓN DE IMP'])){
                const generacion = alumno['PROMOCIÓN DE IMP'].toString().trim();
              }else{
                errores.push({ alumno, error: "Generación inválida: " + alumno['PROMOCIÓN DE IMP'] });
                continue;
              }
              const carrera = (alumno['CARRERA'] || '').toString().trim();
              const estatus = alumno['ESTATUS'].toString().trim();
              if (carrera === "H-MEDICO CIRUJANO Y HOMEOPATA") {
                numcarrera = 1;
              } else if (carrera === "P-MEDICO CIRUJANO Y PARTERO") {
                numcarrera = 2;
              }else{
                errores.push({ alumno, error: "Carrera inválida: " + carrera });
                continue;
              }
              if(estatus === "CANDIDATO"){ {
                numestatus = 1;
              }} else if (estatus === "ASPIRANTE") {
                numestatus = 2;
              }else{
                errores.push({ alumno, error: "Estatus inválido: " + estatus });
              }

              if(await prisma.Persona.findUnique({ where: { boleta: boleta }}) != undefined){
                errores.push({ alumno, error: "Boleta duplicada: " + boleta });
                continue;
              }

              if(await prisma.Persona.findUnique({ where: { correo: correo }}) != undefined){
                errores.push({ alumno, error: "Correo duplicado: " + correo });
                continue;
              }
              if(await prisma.Persona.findUnique({ where: { curp: curp }}) != undefined){
                errores.push({ alumno, error: "CURP duplicado: " + curp });
                continue;
              }

              const user = await prisma.Persona.create({
                data: {
                  boleta: boleta,
                  correo: correo,
                  curp: curp,
                  nombre: nombre,
                  APELLIDO_PATERNO: fullname.apellido_paterno,
                  APELLIDO_MATERNO: fullname.apellido_materno,
                  rol: "ALUMNO"
                }
              });

              const alumnoRegistrado = await prisma.Alumno.create({
                data: {
                  boleta: boleta,
                  estatus: numestatus,
                  generacion: generacion,
                  carrera: numcarrera
                }
              });
            }
            return res.json({ 
                error: 0, 
                message: "Alumnos cargados exitosamente", 
                totalAlumnos: alumnos.length,
                errores: errores
            });
        } catch (error) {
            console.error(error); 
            if (error.message === "TOKEN_EXPIRED") {
                return res.json({ error: 1, message: "Token expirado" });
            }
            if (error.message === "INVALID_TOKEN") {
                return res.json({ error: 1, message: "Token inválido" });
            }
            return res.json({ error: 1, message: "Error al procesar los datos: " + error.message });
        } finally {
            if (req.file) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error("Error al eliminar archivo temporal:", err);
                });
            }
        }
    }); 
};
          
actions.obtenerTodosAdmins = async (req, res) => {
  const { tk } = req.query; 
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const admins = await prisma.PAdmin.findMany({
        select: {
          perfil: true,
          estatus: true,
          persona: {
            select: {
              boleta: true,
              nombre: true,
              APELLIDO_PATERNO: true,
              APELLIDO_MATERNO: true,
              curp: true,
              correo: true,
              sexo: true,
              telefonoMovil: true,
              telefonoFijo: true
            }
          }
        }
      });

      for (let admin of admins) {
        admin.estatus = await prisma.ESTATUS_P_ADMIN.findUnique({
          where: { ID: admin.estatus },
          select: { DESCRIPCION: true }
        });
        if(admin.perfil === 1){
          admin.perfil = "Administrador de seguimiento";
        } else if (admin.perfil === 2) {
          admin.perfil = "Administrador general";
        }
      }
      res.json({ error: 0, message: "Datos", admins });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.error(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {    
    res.json({ error: 1, message: "Error al obtener datos" });
    }
  }
};

actions.agregarAdmin = async (req, res) => {
  const {
    apellido_materno,
    apellido_paterno,
    correo,
    curp,
    nombre,
    numempleado,
    perfil,
    sexo,
    telcelular,
    tellocal,
    tk
  } = req.body;
  try {
    if (tk,apellido_materno,apellido_paterno,curp,correo,nombre,numempleado,perfil) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      if(await prisma.Persona.findUnique({ where: { boleta: numempleado }}) != undefined){
        return res.json({ error: 1, message: "Número de empleado duplicado:" + numempleado });
      } 
      if(await prisma.Persona.findUnique({ where: { correo: correo }}) != undefined){
        return res.json({ error: 1, message: "Correo duplicado:" + correo });
      }
      if(await prisma.Persona.findUnique({ where: { curp: curp }}) != undefined){
        return res.json({ error: 1, message: "CURP duplicado:" + curp });
      }
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const user = await prisma.Persona.create({
          data: {
            boleta: numempleado,
            contrasena: hashedPassword,
            correo: correo,
            curp: curp,
            nombre: nombre,
            APELLIDO_PATERNO: apellido_paterno,
            APELLIDO_MATERNO:apellido_materno,
            sexo: sexo,
            telefonoMovil: telcelular,
            telefonoFijo: tellocal,
            rol: "P_ADMIN"
          }
        });
      const admin = await prisma.PAdmin.create({
        data: {
          boleta: numempleado,
          perfil: parseInt(perfil),
          estatus: 0
        }
      });
      const loginUrl = process.env.FRONT_END_URL + `/iniciar-sesion`;
      let emailContent = await fs.readFile(
        "./templates/sendCredentials.html",
        "utf8"
      );
      emailContent = emailContent.replace(/\$loginUrl/g, loginUrl);
      emailContent = emailContent.replace(/\$tempPassword/g, randomPassword);
      await sendEmail({
        to: correo,
        subject: "Credenciales de acceso",
        html: emailContent,
      });
      res.json({ error: 0, message: "Se ha agregado al administrador", admin });
    }
    else {
      res.json({ error: 1, message: "Faltan parámetros" });
    }
  } catch (error) {
    console.error(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      res.json({ error: 1, message: "Error al agregar administrador" });
    }
  }
};

actions.editarAdmin = async (req, res) => {
  const {
    apellido_materno, 
    apellido_paterno,
    correo,
    curp,
    estatus,
    nombre,
    numempleado,
    perfil,
    sexo,
    telcelular,
    tellocal,
    tk
  } = req.body;

  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const admin = await prisma.PAdmin.findUnique({
        where: { boleta: numempleado },
      });
      if (!admin) {
        return res.json({ error: 1, message: "Administrador no encontrado" });
      }
      await prisma.PAdmin.update({
        where: { boleta: numempleado },
        data: {
          perfil: perfil,
          estatus: estatus,

        },
      });
      await prisma.Persona.update({
        where: { boleta: numempleado },
        data: {
          nombre: nombre,
          APELLIDO_PATERNO: apellido_paterno,
          APELLIDO_MATERNO: apellido_materno,
          correo: correo,
          curp: curp,
          sexo: sexo,
          telefonoMovil: telcelular,
          telefonoFijo: tellocal,
        },
      });
      res.json({ error: 0, message: "Administrador actualizado", admin });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.error(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      res.json({ error: 1, message: "Error al editar administrador" });
    }
  }
};

actions.desactivarAdmin = async (req, res) => {
  const { numempleado, tk } = req.body;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      if(payload.rol !== "P_ADMIN"){
        return res.json({ error: 1, message: "No tienes permisos para desactivar administradores" });
      }
      const admin = await prisma.PAdmin.update({
        where: { boleta: numempleado },
        data: { estatus: 0 },
      });
      res.json({ error: 0, message: "Se ha desactivado al administrador" });
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }   
  } catch (error) {
    console.log(error); 
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      res.json({ error: 1, message: "Error al desactivar administrador" });
    }
  }
};

actions.validarExpediente = async (req, res) => {
  const { ID, estatus, observacion, tk } = req.body;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY); 
      if (payload.rol !== "P_ADMIN") {
        return res.json({ error: 1, message: "No tienes permisos para validar expedientes" });  
      }
      const expediente = await prisma.Expediente.update({
        where: { ID: ID },
        data: {
          estatus: estatus,
          observacion: observacion,
          adminEncargado: payload.id
        }
      });
      res.json({ error: 0, message: "Expediente actualizado", expediente });
    }
    else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "TOKEN_EXPIRED") {
      return res.json({ error: 1, message: "Token expirado" });
    } else if (error.message === "INVALID_TOKEN") {
      return res.json({ error: 1, message: "Token inválido" });
    } else {
      return res.json({ error: 1, message: "Error al validar expediente" });
    }
  }
};

actions.obtenerDetallesAlumnoPorBoleta = async (req, res) => {
  const { boleta,tk } = req.query;
  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const user = await prisma.Persona.findUnique({
        where: { boleta: boleta},
        include: { alumno: true },
      });
      const carrera = await prisma.CARRERA.findUnique({
        where: { ID: user.alumno.carrera },
      });
      const direccion = await prisma.Direccion.findUnique({
        where: { alumnoBoleta: boleta },
      });
      if (user && carrera && direccion) {
        const data = {
          boleta: user.boleta,
          correo: user.correo,
          curp: user.curp,
          rfc: user.alumno.rfc,
          nombre: user.nombre,
          apellido_paterno: user.APELLIDO_PATERNO,
          apellido_materno: user.APELLIDO_MATERNO,
          generacion: user.alumno.generacion,
          promedio: user.alumno.promedio,
          carrera: carrera.NOMBRE,
          calle_y_numero: direccion.calle,
          colonia: direccion.colonia,
          delegacion: direccion.delegacionMunicipio,
          estado: direccion.estado,
          cp: direccion.cp,
          sexo: user.sexo,
          telcelular: user.telefonoMovil,
          tellocal: user.telefonoFijo,
        };
        res.json({ error: 0, message: "Datos", data });
      } else {
        res.json({ error: 1, message: "Hubo problema on alguno de los campos del perfil, por favor ponte en contacto con el administrador" });
      }
    } else {
      res.json({ error: 1, message: "Token requerido" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: 1, message: "Token expirado" });
  }
};

module.exports = actions;
