const router = require("express").Router();
const actionsUser = require('../controllers/user.controllers');


router.post('/loginuser', actionsUser.loginUser);
router.post('/verificarCandidato', actionsUser.verificarCandidato);
router.get('/confirmarCandidato', actionsUser.confirmarCandidato);
router.post('/restablecerPasswordEmail', actionsUser.restablecerPasswordEmail);
router.post('/restablecerPassword', actionsUser.restablecerPassword );
router.get('/getValidarDatos', actionsUser.getValidarDatos);
router.post('/completarRegistro', actionsUser.completarRegistro);

module.exports = router