const router = require("express").Router();
const actionsqr = require('../controllers/qr.controllers');


router.get('/generarToken', actionsqr.generarToken);

module.exports = router