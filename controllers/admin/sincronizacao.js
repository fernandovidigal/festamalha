const { syncLocalidades } = require("../../helpers/sync/localidades");
const { syncEscaloes } = require("../../helpers/sync/escaloes");
const { syncTorneios } = require("../../helpers/sync/torneios");
const { syncEquipas } = require("../../helpers/sync/equipas");

// Como este versão ainda não tem a sincronização funcional o código foi comentado
// para não haver asneira na utilização durante o torneio da malha.
// Descomentar o código e remover a linha res.render('admin/sincronizacao', { breadcrumbs: req.breadcrumbs()});

exports.init = (req, res) => {
    res.render('admin/sincronizacao', { breadcrumbs: req.breadcrumbs()});
}

exports.sincronizarTodos = async (req, res) => {
    // try {
    //     const url = req.session.syncUrl;
    //     await syncLocalidades(url);
    //     await syncTorneios(url);
    //     await syncEscaloes(url);
    //     await syncEquipas(url);
    //     req.flash("success", "Todos os dados sincronizados");
    //     return res.redirect("/admin/sincronizacao");
    // } catch(error){
    //     req.flash("error", "Não foi sincronizar os dados");
    //     res.redirect("/admin/sincronizacao");
    // }
    res.render('admin/sincronizacao', { breadcrumbs: req.breadcrumbs() });
}

exports.sincronizarLocalidades = async (req, res) => {
    // try {
    //     const url = req.session.syncUrl;
    //     await syncLocalidades(url);
    //     req.flash("success", "Localidades sincronizadas");
    //     return res.redirect("/admin/sincronizacao");
    // } catch(error){
    //     req.flash("error", "Não foi sincronizar as localidades");
    //     res.redirect("/admin/sincronizacao");
    // }
    res.render('admin/sincronizacao', { breadcrumbs: req.breadcrumbs() });
}

exports.sincronizarEscaloes = async (req, res) => {
    // try {
    //     const url = req.session.syncUrl;
    //     await syncEscaloes(url);
    //     req.flash("success", "Escalões sincronizados");
    //     return res.redirect("/admin/sincronizacao");
    // } catch(error){
    //     req.flash("error", "Não foi sincronizar os escalões");
    //     res.redirect("/admin/sincronizacao");
    // }
    res.render('admin/sincronizacao', { breadcrumbs: req.breadcrumbs() });
}

exports.sincronizarTorneios = async (req, res) => {
    // try {
    //     const url = req.session.syncUrl;
    //     await syncTorneios(url);
    //     req.flash("success", "Torneios sincronizados");
    //     return res.redirect("/admin/sincronizacao");
    // } catch(error){
    //     req.flash("error", "Não foi sincronizar os torneios");
    //     res.redirect("/admin/sincronizacao");
    // }
    res.render('admin/sincronizacao', { breadcrumbs: req.breadcrumbs() });
}

exports.sincronizarEquipas = async (req, res) => {
    // try {
    //     const url = req.session.syncUrl;
    //     await syncEquipas(url);
    //     req.flash("success", "Equipas sincronizadas");
    //     return res.redirect("/admin/sincronizacao");
    // } catch(error){
    //     req.flash("error", "Não foi sincronizar as equipas");
    //     res.redirect("/admin/sincronizacao");
    // }
    res.render('admin/sincronizacao', { breadcrumbs: req.breadcrumbs() });
}