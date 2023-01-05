const express = require('express');
const router = express.Router();
const { userAuthenticated, checkGestorStatus } = require('../../helpers/auth');
const { check } = require('express-validator');
const LocalidadesController = require('../../controllers/admin/localidades');
const { checkActiveConnection } = require('../../helpers/webApi');

router.all('/*', [userAuthenticated, checkGestorStatus], (req, res, next) => {
    res.locals.menuAdminLocalidades = true;
    req.breadcrumbs('Localidades', '/admin/localidades');
    next();
});

router.get('/', checkActiveConnection, LocalidadesController.getAllLocalidades);

router.get('/adicionarLocalidade', (req, res) => {
    req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
    res.render('admin/adicionarLocalidade', {breadcrumbs: req.breadcrumbs()});
});

router.post('/adicionarLocalidade', [
    check('localidade').trim().escape().notEmpty().withMessage('Deve indicar o nome da localidade'),
    check('localidade').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido')
], LocalidadesController.createLocalidade);

router.get('/editarLocalidade/:id', LocalidadesController.getLocalidade);

router.put('/editarLocalidade/:id', [
    check('localidade').trim().escape().notEmpty().withMessage('Deve indicar o nome da localidade'),
    check('localidade').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido')
], LocalidadesController.updateLocalidade);

// APAGAR LOCALIDADE
router.delete('/deleteLocalidade', LocalidadesController.deleteLocalidade);

// SINCRONIZAR LOCALIDADES
router.get('/sincronizarLocalidades', LocalidadesController.sincronizarLocalidades);

module.exports = router;