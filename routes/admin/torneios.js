const express = require('express');
const router = express.Router();
const { userAuthenticated, checkGestorStatus } = require('../../helpers/auth');
const { check} = require('express-validator');
const TorneiosController = require('../../controllers/admin/torneios');
const { checkActiveConnection } = require('../../helpers/webApi');

router.all('/*', [userAuthenticated, checkGestorStatus], (req, res, next) => {
    res.locals.menuAdminTorneios = true;
    req.breadcrumbs('Torneios', '/admin/torneios');
    next();
});

router.get('/', checkActiveConnection, TorneiosController.getAllTorneios);

router.get('/adicionarTorneio', TorneiosController.adicionarTorneio);

router.post('/adicionarTorneio', [
    check('designacao').notEmpty().withMessage('Deve indicar a designação do torneio.'),
    check('localidade').notEmpty().withMessage('Deve indicar a localidade do torneio.'),
    check('localidade').matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido'),
    check('ano').notEmpty().withMessage('Deve indicar o ano do torneio.'),
    check('ano').matches(/^[0-9]{4}$/).withMessage('Ano do torneio inválido'),
], TorneiosController.createTorneio);

router.get('/activaTorneio/:id', TorneiosController.ActivaTorneio);

router.get('/editarTorneio/:id/:tab?', TorneiosController.getTorneio);

router.put('/editarTorneio/:id/:tab?', [
    check('designacao').notEmpty().withMessage('Deve indicar a designação do torneio.'),
    check('localidade').notEmpty().withMessage('Deve indicar a localidade do torneio.'),
    check('localidade').matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido'),
    check('ano').notEmpty().withMessage('Deve indicar o ano do torneio.'),
    check('ano').matches(/^[0-9]{4}$/).withMessage('Ano do torneio inválido'),
] ,TorneiosController.updateTorneio);

router.delete('/deleteTorneio', TorneiosController.deleteTorneio);

router.delete('/deleteFase', TorneiosController.deleteFase);

router.get('/sincronizarTorneios', TorneiosController.sincronizarTorneios);

router.get('/getAllEquipas/escalao/:escalaoId/fase/:fase', TorneiosController.getAllEquipas);

router.post('/substituirEquipas', TorneiosController.substituirEquipas);

router.delete('/resetTorneio', TorneiosController.resetTorneio);

router.delete('/deleteEquipas', TorneiosController.deleteEquipas);

module.exports = router;