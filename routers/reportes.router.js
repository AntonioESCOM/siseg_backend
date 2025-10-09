const router = require("express").Router();
const actionsreportes = require('../controllers/reportes.controllers');


router.get('/obtenerReportesAlumno', actionsreportes.obtenerReportesAlumno);

module.exports = router