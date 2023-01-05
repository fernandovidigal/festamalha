const express = require('express');
const router = express.Router();
const { userAuthenticated, checkAdminStatus } = require('../../helpers/auth');
const SincronizacaoController = require('../../controllers/admin/sincronizacao');
const { checkActiveConnection } = require('../../helpers/webApi');

router.all('/*', [userAuthenticated, checkAdminStatus], (req, res, next) => {
    res.locals.menuAdminSincronizacao = true;
    req.breadcrumbs('Sincronização', '/admin/sincronizacao');
    next();
});

router.get('/', checkActiveConnection, SincronizacaoController.init);

router.get('/sincronizarTodos', SincronizacaoController.sincronizarTodos);

router.get('/sincronizarLocalidades', SincronizacaoController.sincronizarLocalidades);

router.get('/sincronizarEscaloes', SincronizacaoController.sincronizarEscaloes);

router.get('/sincronizarTorneios', SincronizacaoController.sincronizarTorneios);

router.get('/sincronizarEquipas', SincronizacaoController.sincronizarEquipas);

module.exports = router;