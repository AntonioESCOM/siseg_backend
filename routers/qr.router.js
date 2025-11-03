const router = require("express").Router();
const actionsqr = require('../controllers/qr.controllers');


router.get('/generarQr', actionsqr.generarQr);
router.post('/registrarQr', actionsqr.registrarQr);
router.get('/obtenerRegistrosQr', actionsqr.obtenerRegistrosQr);

module.exports = router