const express = require('express');
const router = express.Router();
const { userAuthenticated, checkAdminStatus } = require('../../helpers/auth');
const { check } = require('express-validator');
const ConfiguracoesController = require('../../controllers/admin/configuracoes');

router.all('/*', [userAuthenticated, checkAdminStatus], (req, res, next) => {
    res.locals.menuAdminConfig = true;
    req.breadcrumbs('Configuraçoes', '/admin/configuracoes');
    next();
});

router.get('/', ConfiguracoesController.getConfig);

router.put('/definirPorta', ConfiguracoesController.writeConfigServerPorta);

router.put('/switchFaker', ConfiguracoesController.switchFaker);

router.put('/switchSync', ConfiguracoesController.switchSync);

router.put('/definirEnderecoWeb', ConfiguracoesController.definirEnderecoWeb);

module.exports = router;