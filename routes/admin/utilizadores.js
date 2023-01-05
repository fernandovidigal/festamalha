const express = require('express');
const router = express.Router();
const { userAuthenticated, checkAdminStatus } = require('../../helpers/auth');
const { check } = require('express-validator');
const UsersController = require('../../controllers/admin/utilizadores');

router.all('/*', [userAuthenticated, checkAdminStatus], (req, res, next) => {
    res.locals.menuAdminUtilizadores = true;
    req.breadcrumbs('Utilizadores', '/admin/utilizadores');
    next();
});

router.get('/', UsersController.getAllUsers);

// ADICIONAR UTILIZADOR
router.get('/adicionarUtilizador', (req, res) => {
    req.breadcrumbs('Adicionar Utilizador', '/admin/adicionarUtilizador');
    res.render('admin/adicionarUtilizador', {breadcrumbs: req.breadcrumbs()});
});

router.post('/adicionarUtilizador', [
    check('username').trim().escape().not().isEmpty().withMessage('Deve indicar o nome de utilizador'),
    check('password').not().isEmpty().withMessage('Deve indicar a password'),
    check('confirmPassword').custom((value, { req }) => {
        if(value.trim() == ''){
            throw new Error('Deve confirmar a password');
        } else if(value.trim() !== req.body.password.trim()){
            throw new Error('As passwords devem ser iguais');
        }

        return true;
    })
], UsersController.createUser);

// EDITAR UTILIZADOR
router.get('/alterarPasswordUtilizador/:id', UsersController.getUser);

router.put('/alterarPasswordUtilizador/:id', [
    check('password').not().isEmpty().withMessage('Deve inidicar a password'),
    check('confirmPassword').custom((value, { req }) => {
        if(value.trim() == ''){
            throw new Error('Deve confirmar a password');
        } else if(value.trim() !== req.body.password.trim()){
            throw new Error('As passwords devem ser iguais');
        }

        return true;
    })
], UsersController.updateUserPassword);

// APAGAR UTILIZADOR
router.delete('/deleteUser', UsersController.deleteUser);

// ALTERAR LEVEL
router.get('/changeLevel/:userId/level/:level', UsersController.changeUserLevel);

module.exports = router;