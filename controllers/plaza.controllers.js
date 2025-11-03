const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../helpers/general_helper');
const { verifyTokenWithErrorHandling } = require('../helpers/general_helper');
const { upload } = require('../helpers/general_helper');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const actions = {}

actions.obtenerPlazas = async (req, res) => {
    const {tk} = req.query;
        try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
            const plazas = await prisma.Plaza.findMany({}); 
            if (plazas) {
              res.json({ error: 0, message: "Datos", plazas });
            } else {
              res.json({ error: 1, message: "Usuario no encontrado" });
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

actions.agregarPlaza = async (req, res) => {
    const { beca, carrera, programa, promocion, sede, tarjeta, tk, ubicacion } = req.body;
      try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);           
            const nuevaPlaza = await prisma.Plaza.create({
                data: {
                    tipoBeca: beca,
                    carrera: carrera,
                    promocion: promocion,
                    sede: sede, 
                    tarjetaDisponible: tarjeta,
                    ubicacion: ubicacion,
                    estatus: 1,
                    PROGRAMA: programa
                },
              }); 
                if (nuevaPlaza) {
                    res.json({ error: 0, message: "Plaza agregada", nuevaPlaza });
                } else {
                    res.json({ error: 1, message: "Error al agregar plaza" });
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

actions.eliminarPlaza = async (req, res) => {
    const { idPlaza, tk } = req.body;
      try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);           
            const plazaEliminada = await prisma.Plaza.delete({
                where: {  
                    ID: parseInt(idPlaza)
                },
              }); 
                if (plazaEliminada) {
                    res.json({ error: 0, message: "Plaza eliminada", plazaEliminada });
                } else {
                    res.json({ error: 1, message: "Error al eliminar plaza" });
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

actions.editarPlaza = async (req, res) => {
    const { idPlaza, beca, carrera, programa, promocion, sede, tarjeta, tk, ubicacion } = req.body;
    try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
            const plazaActualizada = await prisma.Plaza.update({
                where: { ID: parseInt(idPlaza) },
                data: {
                    tipoBeca: beca,
                    carrera: carrera,
                    promocion: promocion,
                    sede: sede,
                    tarjetaDisponible: tarjeta,
                    ubicacion: ubicacion,
                    estatus: 1,
                    PROGRAMA: programa
                }
            });
            if (plazaActualizada) {
                res.json({ error: 0, message: "Plaza actualizada", plazaActualizada });
            } else {
                res.json({ error: 1, message: "Error al actualizar plaza" });
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

actions.asignarPlaza = async (req, res) => {
    const { idPlaza, idUsuario, tk } = req.body;  
      try {
        if(tk){
            const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
            const plazaAsignada = await prisma.Alumno.update({
                where: {  
                    boleta: idUsuario
                },
                data: {
                    sede: parseInt(idPlaza)
                }
              });
                if (plazaAsignada) {
                    res.json({ error: 0, message: "Plaza asignada", plazaAsignada });
                } else {
                    res.json({ error: 1, message: "Error al asignar plaza" });
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



actions.getMapaData = async (req, res) => {
  const { tk } = req.query;

  try {
    if (tk) {
      const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
      const mapaData = await prisma.Plaza.findMany({ select: { sede: true, ubicacion: true } });
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const mapaDataConCoordenadas = [];
      for (const plaza of mapaData) {
        try {
          await delay(1200);
          const response = await axios.get(`https://geocode.maps.co/search`, {
            params: {
              q: `${plaza.ubicacion}`,
              api_key: process.env.MAPS_API_KEY  
            }
          });
          const location = response.data[0];  
          if (location) {
            mapaDataConCoordenadas.push({
              sede: plaza.sede,
              ubicacion: plaza.ubicacion,
              latitude: location.lat,
              longitude: location.lon
            });
          } else {
            mapaDataConCoordenadas.push({
              sede: plaza.sede,
              ubicacion: plaza.ubicacion,
              latitude: null,
              longitude: null
            });
          }
        } catch (error) {
          console.error('Error al obtener coordenadas para la plaza:', plaza.sede);
          mapaDataConCoordenadas.push({
            sede: plaza.sede,
            ubicacion: plaza.ubicacion,
            latitude: null,
            longitude: null
          });
        }
      }
      res.json({ error: 0, data: mapaDataConCoordenadas });
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
      return res.json({ error: 1, message: "Error al obtener datos del mapa" });
    }
  }
};


module.exports = actions