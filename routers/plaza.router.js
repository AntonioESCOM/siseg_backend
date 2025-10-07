const router = require("express").Router();
const actionsUser = require('../controllers/plaza.controllers');

router.get('/obtenerPlazas', actionsUser.obtenerPlazas);



module.exports = router