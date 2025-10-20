const router = require("express").Router();
const actionsencuesta = require('../controllers/encuesta.controllers');
const multer = require("multer");


router.post('/agregarEncuesta', actionsencuesta.agregarEncuesta);
router.get('/obtenerEncuestaAlumno', actionsencuesta.obtenerEncuestaAlumno);

module.exports = router