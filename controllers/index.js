const User = require('../models/User');
const util = require('../helpers/util');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

exports.changeUserPassword = (req, res) => {
    const userId = parseInt(req.params.userId);
    const loggedUserId = parseInt(req.user.userId);

    if(userId === loggedUserId){
        const user = {
            userId: req.user.userId,
            username: req.user.username
        }
        req.breadcrumbs('Alterar Password', '');
        res.render('alterarPassword', { user: user, breadcrumbs: req.breadcrumbs()});
    } else {
        req.flash('error', 'Utilizador inválido');
        req.redirect('/');
    }
}

exports.saveUserPassword = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const loggedUserId = parseInt(req.user.userId);
        const currentPassword = req.body.currentPassword;
        const password = req.body.password;
        const errors = validationResult(req).array({ onlyFirstError: true });

        if(userId !== loggedUserId) throw new Error();

        const user = await User.findByPk(loggedUserId);
        if(!user) throw new Error();

        // Verifica se a password actual é identica
        const match = await bcrypt.compare(currentPassword, user.password);
        if(!match) {
            errors.push({
                location: 'body',
                param: 'currentPassword',
                value: currentPassword,
                msg: 'Password actual inválida'
            });
        }

        if(errors.length > 0) {
            req.breadcrumbs('Alterar Password', '');
            return res.render('alterarPassword', {validationErrors: errors, user: user, breadcrumbs: req.breadcrumbs()});
        }

        user.password = util.encrypt(password);
        const result = await user.save();

        if(!result) throw new Error();

        req.flash('success', 'Password actualizada com sucesso.');
        res.redirect('/');

    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível actualizar a password do utilizador.');
        res.redirect('/');
    }
}