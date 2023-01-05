const express = require('express');
const router = express.Router();
const { userAuthenticated, checkGestorStatus } = require('../../helpers/auth');
const { check } = require('express-validator');
const EscaloesController = require('../../controllers/admin/escaloes');
const { checkActiveConnection } = require('../../helpers/webApi');

router.all('/*', [userAuthenticated, checkGestorStatus], (req, res, next) => {
    res.locals.menuAdminEscaloes = true;
    req.breadcrumbs('Escalões', '/admin/escaloes');
    next();
});

router.get('/', checkActiveConnection, EscaloesController.getAllEscaloes);

router.get('/filtro/:sexo', EscaloesController.getEscalaoBySexo);

router.get('/adicionarEscalao', (req, res) => {
    req.breadcrumbs('Adicionar Escalão', '/admin/adicionarEscalao');
    res.render('admin/adicionarEscalao', {breadcrumbs: req.breadcrumbs()});
});


router.post('/adicionarEscalao', [
    check('designacao').trim().escape().notEmpty().withMessage('Deve indicar a designação do escalão'),
    check('sexo').custom((value, { req }) => {
        if(value !== '0' && value !== '1'){
            throw new Error('Deve selecionar o género a que corresponde o escalão');
        }
    
        return true;
    })
], EscaloesController.createEscalao);

router.get('/editarEscalao/:id', EscaloesController.getEscalao);

router.put('/editarEscalao/:id', [
    check('designacao').trim().escape().notEmpty().withMessage('Deve indicar a designação do escalão'),
    check('sexo').custom((value, { req }) => {
        if(value !== '0' && value !== '1'){
            throw new Error('Deve selecionar o género a que corresponde o escalão');
        }
    
        return true;
    })
], EscaloesController.updateEscalao);

router.delete('/deleteEscalao', EscaloesController.deleteEscalao);

router.get('/sincronizarEscaloes', EscaloesController.sincronizarEscaloes);


module.exports = router;