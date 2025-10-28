const router = require("express").Router();
const actionsUser = require('../controllers/plaza.controllers');

router.get('/obtenerPlazas', actionsUser.obtenerPlazas);
router.post('/agregarPlaza', actionsUser.agregarPlaza);
router.post('/eliminarPlaza', actionsUser.eliminarPlaza);
router.post('/asignarPlaza', actionsUser.asignarPlaza);
router.get('/getMapaData', actionsUser.getMapaData);



module.exports = router