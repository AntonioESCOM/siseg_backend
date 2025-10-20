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

module.exports = actions