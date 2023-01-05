const Localidade = require('../../models/Localidades');
const { validationResult } = require('express-validator');
const util = require('../../helpers/util');
const dbFunctions = require('../../helpers/DBFunctions');
const crypto = require('crypto');
const Sequelize = require('sequelize');
const { syncLocalidades } = require('../../helpers/sync/localidades');
 
exports.getAllLocalidades = async (req, res) => {
    try {
        const _localidades = dbFunctions.getAllLocalidades();
        const _listaLocalidadesComEquipas = dbFunctions.getLocalidadesComEquipas();

        const [localidades, localidadesComEquipas] = await Promise.all([_localidades, _listaLocalidadesComEquipas]);

        util.sort(localidades);

        if(localidades.length > 0){
            localidades.forEach(localidade => {
                const localidadeIndex = localidadesComEquipas.find(el => el.localidadeId == localidade.localidadeId);
                localidade.eliminavel = (!localidadeIndex) ? true : false;
            });
        }
        
        res.render('admin/localidades', {localidades: localidades, breadcrumbs: req.breadcrumbs()});

    } catch(err){
        req.flash('error', 'Não foi possível obter os dados das localidades');
        res.redirect('/admin/localidades');
    }
}

exports.getLocalidade = async (req, res) => {
    try {
        const localidadeId = parseInt(req.params.id);

        const localidade = await dbFunctions.getLocalidade(localidadeId);
        if(localidade){
            req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
            return res.render('admin/editarLocalidade', {localidade: localidade, breadcrumbs: req.breadcrumbs()});
        } else {
            req.flash('error', 'Localidade não existe');
            return res.redirect('/admin/localidades');
        }
    } catch(err) {
        req.flash('error', 'Não foi possível obter os dados da localidade');
        res.redirect('/admin/localidades');
    }
}

exports.createLocalidade = async (req, res) => {
    const localidade = req.body.localidade.trim();
    const errors = validationResult(req);

    const oldData = {
        nome: localidade
    }

    try {
        if(!errors.isEmpty()){
            req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
            return res.render('admin/adicionarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData, breadcrumbs: req.breadcrumbs()});
        }

        const hash = crypto.createHash('sha512').update(localidade.toUpperCase()).digest('hex');

        await Localidade.create({
            nome: localidade,
            hash: hash
        });
        req.flash('success', 'Localidade adicionada');
        return res.redirect('/admin/localidades');
    } catch(err) {
        if(err instanceof Sequelize.UniqueConstraintError){
            const errors = [{
                msg: 'Localidade já existe',
                param: 'localidade'
            }];
            req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
            res.render('admin/adicionarLocalidade', {validationErrors: errors, localidade: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            req.flash('error', 'Não foi possível adicionar a localidade');
            res.redirect('/admin/localidades');
        }
    }
}

exports.updateLocalidade = async (req, res) => {
    const localidadeId = parseInt(req.params.id);
    const nomeLocalidade = req.body.localidade.trim();
    const oldData = {
        localidadeId: localidadeId,
        nome: nomeLocalidade
    }

    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
            return res.render('admin/editarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData, breadcrumbs: req.breadcrumbs()});
        }

        const hash = crypto.createHash('sha512').update(nomeLocalidade.toUpperCase()).digest('hex');

        await Localidade.update({
            nome: nomeLocalidade,
            hash: hash,
        }, {
            where: {
                localidadeId: localidadeId
            }
        });

        req.flash('success', 'Localidade actualizada');
        return res.redirect('/admin/localidades');
    
    } catch(err) {
        if(err instanceof Sequelize.UniqueConstraintError){
            const errors = [{
                msg: 'A Localidade já existe',
                param: 'localidade'
            }];
            req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
            return res.render('admin/editarLocalidade', {validationErrors: errors, localidade: oldData, breadcrumbs: req.breadcrumbs()});
        }

        req.flash('error', 'Não foi possível actualizar a localidade');
        res.redirect('/admin/localidades');
    }
}

exports.deleteLocalidade = async (req, res) => {
    const localidadeId = parseInt(req.body.id);

    if(req.user.level == 5 || req.user.level == 10){
        try {
            const localidade = await Localidade.findByPk(localidadeId);
            
            await localidade.destroy();
    
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(200).json({ success: false });
        }
    } else {
        res.status(200).json({ success: false });
    }
}

exports.sincronizarLocalidades = async (req, res) => {
    try {
        const url = req.session.syncUrl;
        await syncLocalidades(url);
        req.flash("success", "Localidades sincronizadas");
        return res.redirect("/admin/localidades");
    } catch(error) {
        console.log(error);
        req.flash("error", "Não foi sincronizar as localidades");
        res.redirect("/admin/localidades");
    }
}