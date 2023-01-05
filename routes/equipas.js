const express = require('express');
const router = express.Router();
const { userAuthenticated } = require('../helpers/auth');
const { check } = require('express-validator');
const EquipasController = require('../controllers/equipas');
const { checkActiveConnection } = require('../helpers/webApi');

router.all('/*', userAuthenticated, (req, res, next) => {
    res.locals.menuEquipas = true;
    req.breadcrumbs('Equipas', '/equipas');
    next();
});

router.get('/adicionarEquipa', EquipasController.adicionarEquipa);

router.post('/adicionarEquipa', [
    check('primeiroElemento').trim().escape().notEmpty().withMessage('Deve indicar o nome do primeiro elemento da equipa.'),
    check('primeiroElemento').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome do primeiro elemento inválido.'),
    check('segundoElemento').trim().escape().notEmpty().withMessage('Deve indicar o nome do segundo elemento da equipa.'),
    check('segundoElemento').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome do segundo elemento inválido.'),
    check('localidade').not().equals('').withMessage('Deve selecionar a localidade da equipa.'),
    check('escalao').exists().withMessage('Deve selecionar o escalão ao qual pertence a equipa.')
], EquipasController.createEquipa);

router.get('/editarEquipa/:escalao/:id', EquipasController.getEquipaToEdit);

router.put('/editarEquipa/:escalao/:id', [
    check('primeiroElemento').trim().escape().notEmpty().withMessage('Deve indicar o nome do primeiro elemento da equipa.'),
    check('primeiroElemento').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome do primeiro elemento inválido.'),
    check('segundoElemento').trim().escape().notEmpty().withMessage('Deve indicar o nome do segundo elemento da equipa.'),
    check('segundoElemento').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome do segundo elemento inválido.'),
    check('localidade').not().equals('').withMessage('Deve selecionar a localidade da equipa.'),
    check('escalao').exists().withMessage('Deve selecionar o escalão ao qual pertence a equipa.')
], EquipasController.updateEquipa);

router.get('/sincronizarEquipa/:uuid', EquipasController.sincronizarEquipa);

router.get('/sincronizarTodasEquipas', EquipasController.sincronizarTodasEquipas);

router.get('/eliminarEquipa/:equipaId/:escalaoId', EquipasController.getEquipaToDelete);

router.delete('/eliminarEquipa', EquipasController.deleteEquipa);

// Pesquisa de equipas
router.post('/pesquisa/:escalao/:localidadeId?', [
    check('pesquisaEquipaId').trim().escape().notEmpty().withMessage('Deve indicar o Nº da Equipa a pesquisar.'),
    check('pesquisaEquipaId').trim().escape().matches(/^[0-9]+$/).withMessage('Nº da Equipa inválido.')
], EquipasController.searchEquipa);

// Filtro de Equipas
router.get('/filtro/localidade/:localidadeId', EquipasController.filtrarEquipas);
router.get('/filtro/escalao/:escalaoId', EquipasController.filtrarEquipas);
router.get('/filtro/localidade/:localidadeId/escalao/:escalaoId', EquipasController.filtrarEquipas);
router.get('/filtro/localidade/:localidadeId/:perPage?/:page?', EquipasController.filtrarEquipas);
router.get('/filtro/escalao/:escalaoId/:perPage?/:page?', EquipasController.filtrarEquipas);
router.get('/filtro/localidade/:localidadeId/escalao/:escalaoId/:perPage?/:page?', EquipasController.filtrarEquipas);

// API
router.get('/listagem/:localidade/:escalao', EquipasController.listagemEquipas);
router.get('/escaloes', EquipasController.getEscaloes);

// GERAR EQUIPAS ALEATÓRIAMENTE
router.post('/faker/:num', EquipasController.createEquipasAleatoriamente);
router.post('/faker/:num/:escalao', EquipasController.createEquipasAleatoriamentePorEscalao);


router.get('/:perPage?/:page?', checkActiveConnection, EquipasController.getAllEquipas);



module.exports = router;