const router = require("express").Router();
const actionsreportes = require('../controllers/reportes.controllers');
const multer = require("multer");
const { verifyTokenWithErrorHandling } = require('../helpers/general_helper');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { tk} = req.body;
    if (tk) {
      try {
        const payload = verifyTokenWithErrorHandling(tk, process.env.SECRET_KEY);
        const userDir = path.join(__dirname, '../uploads', payload.id.toString(),'/reportes'); 
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir); 
      } catch (error) {
        cb(error);
      }
    } else {
      cb(new Error('Token requerido'));
    }
  },
  filename: (req, file, cb) => {
    const { tk } = req.body; 
      cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });


router.get('/obtenerReportesAlumno', actionsreportes.obtenerReportesAlumno);
router.post('/agregarReporte', upload.array("evidencias", 5), actionsreportes.agregarReporte);
router.get('/obtenerTodosReportes', actionsreportes.obtenerTodosReportes);
router.post("/cambiarEstatusReporte", actionsreportes.cambiarEstatusReporte);
router.post("/agregarObservacionReporte", actionsreportes.agregarObservacionReporte);
module.exports = router;