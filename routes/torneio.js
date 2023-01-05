const express = require('express');
const router = express.Router();
const { userAuthenticated } = require('../helpers/auth');
const { check } = require('express-validator');
const TorneiosController = require('../controllers/torneio');

router.all('/*', userAuthenticated, (req, res, next) => {
  res.locals.menuTorneio = true;
  req.breadcrumbs('Competição', '/torneio');
  next();
});

router.get('/', TorneiosController.checkCampos, TorneiosController.getStarting);

router.post('/definirNumeroCampos', TorneiosController.setNumeroCampos);

// Distribuição de todas as equipas de todos os escalões
router.get('/distribuirTodasEquipas', TorneiosController.distribuirTodasEquipas);

router.get('/distribuirEquipasPorEscalao/escalao/:escalao', TorneiosController.distribuirEquipasPorEscalao);

// Resultados
router.get('/resultados/escalao/:escalao/fase/:fase/campo/:campo', TorneiosController.mostraResultados);

router.get('/processaProximaFase/escalao/:escalao', TorneiosController.processaProximaFase);

// Classificação
router.get('/classificacao/escalao/:escalao/fase/:fase/campo/:campo', TorneiosController.mostraClassificacao);

router.get('/interditarCampos/escalao/:escalao', TorneiosController.interditarCampos);
router.post('/interditarCampos/escalao/:escalao', TorneiosController.adicionarCamposInterditos);

// API
router.post('/registaParciais', TorneiosController.createParciais);

router.post('/actualizaParciais', TorneiosController.updateParciais);

router.get('/getEscalaoInfo/:escalaoId', TorneiosController.getEscalaoInfo);

router.put('/setEscalaoNumCampos', TorneiosController.setNumeroCamposAPI);

router.get('/fichaParciais/:escalao/:fase/:campo', TorneiosController.fichasParciais);

router.get('/getAllCamposPorFase/:escalaoId/:fase', TorneiosController.getAllCamposPorFase);

module.exports = router;
