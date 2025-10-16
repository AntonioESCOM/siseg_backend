const router = require("express").Router();
const actionsUser = require('../controllers/user.controllers');
const multer = require("multer");

router.post('/loginuser', actionsUser.loginUser);
router.post('/verificarCandidato', actionsUser.verificarCandidato);
router.get('/confirmarCandidato', actionsUser.confirmarCandidato);
router.post('/restablecerPasswordEmail', actionsUser.restablecerPasswordEmail);
router.post('/restablecerPassword', actionsUser.restablecerPassword );
router.get('/getValidarDatos', actionsUser.getValidarDatos);
router.post('/completarRegistro', actionsUser.completarRegistro);
router.post('/modificarDatos', actionsUser.modificarDatos);
router.get('/obtenerTodosDatosAlumno', actionsUser.obtenerTodosDatosAlumno);
router.get('/expedienteDigital', actionsUser.expedienteDigital);
router.post('/subirArchivo',actionsUser.subirArchivo);
router.get('/obtenerTodosDatosAdmin', actionsUser.obtenerTodosDatosAdmin);
router.get('/obtenerPlazaAsignada', actionsUser.obtenerPlazaAsignada);
router.get('/obtenerkpis', actionsUser.obtenerkpis);
router.get('/obtenerTodosAlumnos', actionsUser.obtenerTodosAlumnos);
router.post('/editarAlumno', actionsUser.editarAlumno);
router.post('/desactivarAlumno', actionsUser.desactivarAlumno);
router.post('/agregarAlumno', actionsUser.agregarAlumno);
router.post('/cargarAlumnos', actionsUser.cargarAlumnos);

module.exports = router