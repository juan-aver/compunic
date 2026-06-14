const express = require('express');
const router = express.Router();
const AuditoriaController = require('../controllers/auditoria.controller');

router.get('/', AuditoriaController.listar);
router.get('/kpis', AuditoriaController.obtenerKpis);

module.exports = router;
