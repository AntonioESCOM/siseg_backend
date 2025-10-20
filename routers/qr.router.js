const router = require("express").Router();
const actionsqr = require('../controllers/qr.controllers');


router.get('/generarQr', actionsqr.generarQr);
router.post('/registrarQr', actionsqr.registrarQr);

module.exports = router