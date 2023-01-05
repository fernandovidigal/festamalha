const User = require('../../models/User');
const { validationResult } = require('express-validator');
const util = require('../../helpers/util');

exports.getAllUsers = (req, res) => {
    User.findAll()
    .then(users => {
        res.render('admin/utilizadores', {users: users, breadcrumbs: req.breadcrumbs()});
    })
    .catch(err => {
        req.flash('error', 'Ocurreu um erro ao obter dados dos utilizadores!');
        res.redirect('/admin/utilizadores');
    });
}

exports.getUser = (req, res) => {
    const userId = parseInt(req.params.id);

    User.findByPk(userId)
    .then( user => {
        if(user){
            req.breadcrumbs('Alterar Password', '/admin/alterarPasswordUtilizador');
            res.render('admin/alterarPasswordUtilizador', {user: user, breadcrumbs: req.breadcrumbs()});
        } else {
            req.flash('error', 'Utilizador inválido.');
            res.redirect('/admin/utilizadores');
        }
        
    })
    .catch(err => {
        req.flash('error', 'Não foi possível obter dados do utilizador.');
        res.redirect('/admin/utilizadores');
    });
}

exports.createUser = async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const level = parseInt(req.body.level);
        const errors = validationResult(req);

        const oldData = {
            username: username,
            level: level
        }

        if (!errors.isEmpty()) {
            req.breadcrumbs('Adicionar Utilizador', '/admin/adicionarUtilizador');
            res.render('admin/adicionarUtilizador', {validationErrors: errors.array({ onlyFirstError: true }), utilizador: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            if(req.user.level != 10) {
                req.flash('error', 'Não tem permissões para registar utilizadores');
                return res.redirect('/admin/utilizadores');
            }

            const [user, created] = await User.findOrCreate({
                                        where: { username: username },
                                        defaults: {
                                            password: util.encrypt(password),
                                            level: level
                                        }
                                    });
            if(!created){
                const errors = [{
                    msg: 'Nome de utilizador já existe',
                    param: 'username'
                }]
                return res.render('admin/adicionarUtilizador', {validationErrors: errors, utilizador: oldData, breadcrumbs: req.breadcrumbs()});
            }

            req.flash('success', 'Utilizador registado');
            res.redirect('/admin/utilizadores');
        }
    } catch(err) {
        req.flash('error', 'Não foi possível registar o utilizador');
        res.redirect('/admin/utilizadores');
    }
}

exports.updateUserPassword = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const password = req.body.password;
        const errors = validationResult(req);

        const user = await User.findByPk(userId);

        if(!user){
            req.flash('error', 'Utilizador inexistente.');
            return res.redirect('/admin/utilizadores');
        }

        if(!errors.isEmpty()){
            req.breadcrumbs('Alterar Password', '/admin/alterarPasswordUtilizador');
            return res.render('admin/alterarPasswordUtilizador', {validationErrors: errors.array(), user: user, breadcrumbs: req.breadcrumbs()});
        }

        user.password = util.encrypt(password);
        const result = await user.save();

        if(!result){
            throw new Error();
        }

        req.flash('success', 'Password actualizada');
        res.redirect('/admin/utilizadores');

    } catch(err) {
        req.flash('error', 'Não foi possível actualizar a password do utilizador');
        res.redirect('/admin/utilizadores');
    }
}

exports.changeUserLevel = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const level = parseInt(req.params.level);

        if(req.user.level != 10) {
            req.flash('error', 'Não tem permissão para alterar o nível de acesso dos utilizadores');
            return res.redirect('/admin/utilizadores');
        }

        const result = await User.update({ level: level }, {where: {userId: userId}, limit: 1});
        if(!result){
            throw new Error();
        }

        req.flash('success', 'Nível de acesso do utilizador foi alterado');
        res.redirect('/admin/utilizadores');
    } catch(err) {
        req.flash('error', 'Não foi possível alterar o nível de acesso do utilizador');
        res.redirect('/admin/utilizadores');
    }
}

exports.deleteUser = async (req, res) => {
    try{
        const userId = parseInt(req.body.id);
        const user = await User.findByPk(userId);

        if(!user) throw new Error();

        if(req.user.level != 10) throw new Error();

        const numAdmins = await User.count({ 
            where: { level: 10 }
        });

        if(numAdmins == 1 && user.level == 10){
            return res.status(204).json({ success: false });
        }

        await user.destroy();
        res.status(200).json({success: true});
        
    } catch(err){
        res.status(200).json({success: false});
    }
}