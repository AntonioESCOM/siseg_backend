const router = require("express").Router();
const actionsqr = require('../controllers/qr.controllers');


router.get('/generarQr', actionsqr.generarQr);

module.exports = router