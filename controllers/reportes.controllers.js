const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyTokenWithErrorHandling } = require('../helpers/general_helper');
const fs = require('fs').promises;
const path = require('path');


const actions = {}

actions.obtenerReportesAlumno = async (req, res) => {
    const {tk} = req.query;
        try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
            const reportes = await prisma.Reporte.findMany({where: { alumnoBoleta: payload.id }}); 
            for (let reporte of reportes) {
              if (reporte.adminEncargado) {
                reporte.adminEncargado = await prisma.Persona.findUnique({
                  where: { boleta: reporte.adminEncargado },
                  select: { nombre: true, APELLIDO_PATERNO: true, APELLIDO_MATERNO: true }
                });
              }
            }
            const fullreportes = [];
            if (reportes) {
              const fullreportes = await Promise.all(
                reportes.map(async (reporte) => {
                  const evidencias = await prisma.REPORTE_EVIDENCIA.findMany({ where: { REPORTE_ID: reporte.id }, select: { URL_ARCHIVO: true }  });
                  const observaciones = await prisma.REPORTE_OBSERVACION.findMany({ where: { REPORTE_ID: reporte.id }, select: { DESCRIPCION: true, FECHA_DATETIME:true, AUTOR_ADMIN:true } });
                  for (const obs of observaciones) {
                    obs.AUTOR_ADMIN  = await prisma.Persona.findUnique({
                      where: { boleta: obs.AUTOR_ADMIN },
                      select: { nombre: true, APELLIDO_PATERNO: true, APELLIDO_MATERNO: true }
                    });
                  }        
                  return { ...reporte, evidencias,observaciones};
                })
              );
              console.log(fullreportes);
              res.json({ error: 0, message: "Datos", fullreportes });
            } else {
              res.json({ error: 1, message: "Error al obtener reportes" });
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

actions.agregarReporte = async (req, res) => {
  const { tk,descripcion} = req.body;
  try {
  if (!tk) {
     return res.json({ error: 1, message: "Token requerido" });
  }
  const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
  const reporte = await prisma.Reporte.create({
        data: {
          alumno: {
            connect: {
                boleta: payload.id, 
            },
          },
          descripcion: descripcion,
          estatus: 1
  }});
  if (req.files?.length) {
    for (const f of req.files) {
      const ruta = `${process.env.BASE_URL}/uploads/${payload.id}/reportes/${f.filename}`;
      await prisma.REPORTE_EVIDENCIA.create({
        data: {
          REPORTE_ID: reporte.id,
          URL_ARCHIVO: ruta,
        },
      });
    }
  }
  res.json({ error: 0, message: "Se ha registrado el reporte" });
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

};

actions.obtenerTodosReportes = async (req, res) => {
    const {tk} = req.query;
        try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
            const reportes = await prisma.Reporte.findMany({ orderBy: { fechaRegistro: 'desc' } });
            for (let reporte of reportes) {
              if (reporte.adminEncargado) {
                reporte.adminEncargado = await prisma.Persona.findUnique({
                  where: { boleta: reporte.adminEncargado },
                  select: { nombre: true, APELLIDO_PATERNO: true, APELLIDO_MATERNO: true }
                });
              }
            }
            const fullreportes = [];
            if (reportes) {
              const fullreportes = await Promise.all(
                reportes.map(async (reporte) => {
                  const evidencias = await prisma.REPORTE_EVIDENCIA.findMany({ where: { REPORTE_ID: reporte.id }, select: { URL_ARCHIVO: true }  });
                  const observaciones = await prisma.REPORTE_OBSERVACION.findMany({ where: { REPORTE_ID: reporte.id }, select: { DESCRIPCION: true, FECHA_DATETIME:true, AUTOR_ADMIN:true } });
                  for (const obs of observaciones) {
                    obs.AUTOR_ADMIN  = await prisma.Persona.findUnique({
                      where: { boleta: obs.AUTOR_ADMIN },
                      select: { nombre: true, APELLIDO_PATERNO: true, APELLIDO_MATERNO: true }
                    });
                  }        
                  return { ...reporte, evidencias,observaciones};
                })
              );
              console.log(fullreportes);
              res.json({ error: 0, message: "Datos", fullreportes });
            } else {
              res.json({ error: 1, message: "Error al obtener reportes" });
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

actions.cambiarEstatusReporte = async (req, res) => {
    const { idReporte, nuevoEstatus, tk } = req.body;
      try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);           
            const reporteActualizado = await prisma.Reporte.update({  
                where: {
                    id: parseInt(idReporte)
                },
                data: {   
                    estatus: parseInt(nuevoEstatus),
                    adminEncargado: payload.id,
                    fechaModificacion: new Date()
                },
              }); 
                if (reporteActualizado) {
                    res.json({ error: 0, message: "Reporte actualizado", reporteActualizado });
                } else {
                    res.json({ error: 1, message: "Error al actualizar reporte" });
                }
            } else {
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
    };

actions.agregarObservacionReporte = async (req, res) => {
    const { idReporte, descripcion, tk } = req.body;
      try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
            const nuevaObservacion = await prisma.REPORTE_OBSERVACION.create({
              data: {
                DESCRIPCION: descripcion,
                FECHA_DATETIME: new Date(),
                AUTOR_ADMIN: payload.id,
                REPORTE_ID: parseInt(idReporte)
              }
            });
            if (nuevaObservacion) {
              res.json({ error: 0, message: "Observación agregada" });
            } else {
              res.json({ error: 1, message: "Error al agregar observación" });
            }
          } else {
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
};

module.exports = actions