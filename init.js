const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


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
        } });
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