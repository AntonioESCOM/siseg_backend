const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyTokenWithErrorHandling } = require('../helpers/general_helper');

const actions = {}

actions.agregarEncuesta = async (req, res) => {
    const {tk,respuestas} = req.body;
        try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);           
            const nuevaEncuesta = await prisma.Encuesta.create({
                data: {
                    alumno: {
                        connect: {
                            boleta: payload.id, 
                        },
                    },
                    fechaRegistro: new Date(),
                    respuesta:JSON.stringify( respuestas), 
                },
              });               
                if (nuevaEncuesta) {
                    res.json({ error: 0, message: "Encuesta agregada", nuevaEncuesta });
                } else {
                    res.json({ error: 1, message: "Error al agregar encuesta" });
                }
        }else{
            res.json({ error: 1, message: "Token requerido" });
        }
      } catch (error) {
        console.log(error);     
        if (error.message === 'TOKEN_EXPIRED') {
          return res.json({ error: 1, message: "Token expirado" });
        }
        else if (error.message === 'INVALID_TOKEN') {
            return res.json({ error: 1, message: "Token inválido" });
        } else {
            return res.json({ error: 1, message: "Error al confirmar usuario" });
        }
    }
}

actions.obtenerEncuestaAlumno = async (req, res) => {
    const {tk} = req.query;
        try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
            const encuesta = await prisma.Encuesta.findFirst({  
                where: { alumnoBoleta: payload.id },
                orderBy: { alumnoBoleta: 'asc' }
            }); 
            if (encuesta) {
              res.json({ error: 0, message: "Datos", encuesta });
            } else {
              res.json({ error: 1, message: "No se encontró encuesta" });
            }
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

module.exports = actions;