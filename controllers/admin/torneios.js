const sequelize = require("../../helpers/database");
const Torneios = require("../../models/Torneios");
const Campos = require("../../models/Campos");
const Jogos = require("../../models/Jogos");
const Equipas = require("../../models/Equipas");
const Interdicoes = require("../../models/Interdicoes");
const dbFunctions = require("../../helpers/DBFunctions");
const { validationResult } = require("express-validator");
const crypto = require('crypto');
const axios = require('axios');
const Sequelize = require('sequelize');
const { syncTorneios } = require('../../helpers/sync/torneios');

exports.getAllTorneios = async (req, res) => {
  try {
    const torneios = await dbFunctions.getAllTorneios();
    res.render("admin/torneios", {
      torneios: torneios,
      breadcrumbs: req.breadcrumbs()
    });
  } catch (err) {
    req.flash("error", "Não foi possível obter os torneios");
    res.redirect("/admin/torneios");
  }
};

exports.getTorneio = async (req, res) => {
  try {
    const torneioId = parseInt(req.params.id);
    let tab = req.params.tab || 1;

    if (tab < 1 || tab > 5) {
      tab = 1;
    }

    const _listaEscaloes = dbFunctions.getAllEscaloes();
    const _listaNumJogos = dbFunctions.getNumJogosAllEscaloes(torneioId);
    const _torneio = dbFunctions.getTorneioById(torneioId);
    const _listaUltimaFasePorEscalao = dbFunctions.getUltimaFasePorEscalao(torneioId);
    const _listaNumCampos = dbFunctions.getNumCamposEscaloes(torneioId);
    const _numEquipasPorEscalao = dbFunctions.getNumEquipasPorCadaEscalao(torneioId);
    const _totalJogos = dbFunctions.getTotalJogos(torneioId);

    const [listaEscaloes, torneio, listaNumJogos, listaUltimaFasePorEscalao, listaNumCampos, numEquipasPorEscalao, totalJogos] = await Promise.all([
      _listaEscaloes,
      _torneio,
      _listaNumJogos,
      _listaUltimaFasePorEscalao,
      _listaNumCampos,
      _numEquipasPorEscalao,
      _totalJogos
    ]);

    const numTotalEquipas = numEquipasPorEscalao.reduce((acumulador, { numEquipas }) => acumulador + numEquipas, 0);

    for (const escalao of listaEscaloes) {
      const jogos = listaNumJogos.find(el => el.escalaoId == escalao.escalaoId);
      const numCampos = listaNumCampos.find(el => el.escalaoId == escalao.escalaoId);
      const fase = listaUltimaFasePorEscalao.find(el => el.escalaoId == escalao.escalaoId);
      const numEquipas = numEquipasPorEscalao.find(el => el.escalaoId == escalao.escalaoId);

      escalao.campos = numCampos != undefined ? numCampos.numCampos : 0;
      escalao.editavel = jogos == undefined ? true : false;
      escalao.fase = fase != undefined ? fase.fase : 0;
      escalao.numEquipas = numEquipas != undefined ? numEquipas.numEquipas : 0;
    }

    req.breadcrumbs("Editar Torneio", "/admin/editarTorneio");
    res.render("admin/editarTorneio", { torneio: torneio, escaloes: listaEscaloes, selectedTab: tab, numTotalJogos: totalJogos, numTotalEquipas: numTotalEquipas, breadcrumbs: req.breadcrumbs() });
  } catch (err) {
    req.flash("error", "Não é possível editar o torneio");
    res.redirect("/admin/torneios");
  }
}

exports.adicionarTorneio = async (req, res) => {
  try {
    const escaloes = await dbFunctions.getAllEscaloes();
    escaloes.forEach(escalao => {
      escalao.editavel = true
    });

    req.breadcrumbs("Adicionar Torneio", "/admin/adicionarTorneio");
    res.render("admin/adicionarTorneio", { torneio: {}, escaloes: escaloes, breadcrumbs: req.breadcrumbs() });

  } catch (err) {
    req.flash("error", "Não foi possivel adicionar torneio");
    res.redirect("/admin/torneios");
  }
};

async function processaCriacaoCampos(torneioId, listaEscaloes) {
  const campos = [];

  listaEscaloes.forEach(escalao => {
    if (escalao.campos > 0) {
      const campo = {
        torneioId: torneioId,
        escalaoId: escalao.escalaoId,
        numCampos: escalao.campos
      }
      campos.push(campo);
    }
  });

  await Campos.bulkCreate(campos);
}

exports.createTorneio = async (req, res) => {
  const designacao = req.body.designacao.trim();
  const localidade = req.body.localidade.trim();
  const ano = parseInt(req.body.ano.trim());
  const errors = validationResult(req);

  const oldData = {
    designacao: designacao,
    localidade: localidade,
    ano: ano
  };

  try {
    // Processa todos os escalões
    const listaEscaloes = await dbFunctions.getAllEscaloes();
    listaEscaloes.forEach(escalao => {
      const numCampos = parseInt(req.body[escalao.escalaoId]);
      escalao.campos = (Math.log2(numCampos) % 1 === 0) ? numCampos : 0;
    });

    // Verifica o número de torneios
    const numTorneios = await dbFunctions.getNumTorneios();

    if (!errors.isEmpty()) {
      req.breadcrumbs("Adicionar Torneio", "/admin/adicionarTorneio");
      return res.render("admin/adicionarTorneio", { validationErrors: errors.array({ onlyFirstError: true }), escaloes: listaEscaloes, torneio: oldData, breadcrumbs: req.breadcrumbs() });
    }

    const torneioToHash = designacao + localidade + ano;
    const hash = crypto.createHash('sha512').update(torneioToHash.toUpperCase()).digest('hex');
    //const transaction = await sequelize.transaction();

    const torneioModel = await Torneios.create({
      designacao: designacao,
      localidade: localidade,
      ano: ano,
      hash: hash,
    });

    await processaCriacaoCampos(
      torneioModel.torneioId,
      listaEscaloes
    );

    let message = '';
    // Escolheu adicionar e activar o torneios
    if (req.body.adicionar_activar || numTorneios == 0) {
      await dbFunctions.setTorneioActivo(torneioModel.torneioId);
      message = 'Torneio adicionado e activado';
    } else {
      message = 'Torneio adicionado';
    }

    req.flash('success', message);
    return res.redirect('/admin/torneios');
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      const errors = [{
        msg: 'O Torneio já existe',
        param: 'designacao'
      }];
      req.breadcrumbs("Adicionar Torneio", "/admin/adicionarTorneio");
      return res.render("admin/adicionarTorneio", { validationErrors: errors, escaloes: listaEscaloes, torneio: oldData, breadcrumbs: req.breadcrumbs() });
    } else {
      console.log(err);
      req.flash("error", "Não foi possivel adicionar o torneio");
      res.redirect("/admin/torneios");
    }
  }
}

exports.ActivaTorneio = async (req, res) => {
  try {
    const torneioId = parseInt(req.params.id);

    const torneio = await dbFunctions.getTorneioById(torneioId);
    if (torneio) {
      await dbFunctions.setTorneioActivo(torneio.torneioId);
      req.flash("success", `${torneio.designacao}, activado`);
      res.redirect("/admin/torneios");
    } else {
      req.flash("error", "Torneio não existe");
      res.redirect("/admin/torneios");
    }
  } catch (err) {
    console.log(err);
    req.flash("error", "Não foi possível activar o torneio");
    res.redirect("/admin/torneios");
  }
};

async function processaUpdateCampos(transaction, torneioId, listaEscaloes) {
  const listaCampos = await dbFunctions.getAllCamposTransaction(torneioId, transaction);

  for await (const escalao of listaEscaloes) {
    const campoToUpdate = listaCampos.find(el => el.escalaoId == escalao.escalaoId);

    if (campoToUpdate) {
      if (escalao.campos == 0) {
        await campoToUpdate.destroy({ transaction });
      } else {
        await campoToUpdate.update({ numCampos: escalao.campos }, { transaction });
      }
    } else {
      if (escalao.campos > 0) {
        await Campos.create({
          torneioId: torneioId,
          escalaoId: escalao.escalaoId,
          numCampos: escalao.campos
        }, { transaction }
        );
      }
    }
  }
}

exports.updateTorneio = async (req, res) => {
  const torneioId = parseInt(req.params.id);
  const designacao = req.body.designacao.trim();
  const localidade = req.body.localidade.trim();
  const ano = parseInt(req.body.ano.trim());
  let tab = req.params.tab || 1;

  if (tab < 1 || tab > 3) {
    tab = 1;
  }

  // Processa todos os escalões
  const listaEscaloes = await dbFunctions.getAllEscaloes();
  listaEscaloes.forEach(escalao => {
    const numCampos = parseInt(req.body[escalao.escalaoId]);
    if (numCampos) {
      escalao.campos = (Math.log2(numCampos) % 1 === 0) ? numCampos : 0;
    }

  });

  const oldData = {
    torneioId: torneioId,
    designacao: designacao,
    localidade: localidade,
    ano: ano
  };

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.breadcrumbs("Editar Torneio", "/admin/editarTorneio");
      return res.render("admin/editarTorneio", { validationErrors: errors.array({ onlyFirstError: true }), torneio: oldData, escaloes: listaEscaloes, selectedTab: tab, breadcrumbs: req.breadcrumbs() });
    }

    const torneioToHash = designacao + localidade + ano;
    const hash = crypto.createHash('sha512').update(torneioToHash.toUpperCase()).digest('hex');

    const transaction = await sequelize.transaction();

    try {
      await Torneios.update({
        designacao: designacao,
        localidade: localidade,
        ano: ano,
        hash: hash
      }, {
        where: {
          torneioId: torneioId
        },
        transaction: transaction
      });

      await processaUpdateCampos(transaction, torneioId, listaEscaloes);
      await transaction.commit();

      req.flash('success', 'Torneio actualizado');
      return res.redirect('/admin/torneios');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      const errors = [{
        msg: 'O Torneio já existe',
        param: 'designacao'
      }];
      req.breadcrumbs("Editar Torneio", "/admin/editarTorneio");
      return res.render("admin/editarTorneio", { validationErrors: errors, torneio: oldData, escaloes: listaEscaloes, selectedTab: tab, breadcrumbs: req.breadcrumbs() });
    }

    req.flash("error", "Não foi possível actualizar o torneio");
    res.redirect("/admin/torneios");
  }
};

exports.deleteTorneio = async (req, res) => {
  const torneioId = parseInt(req.body.id);

  if (req.user.level == 5 || req.user.level == 10) {
    try {
      const torneio = await Torneios.findByPk(torneioId);
      await torneio.destroy();

      res.status(200).json({ success: true });
    } catch (error) {
      return res.status(200).json({ success: false });
    }
  } else {
    res.status(200).json({ success: false });
  }
};

exports.deleteFase = async (req, res) => {
  try {
    const escalaoId = parseInt(req.body.escalaoId);
    const torneioId = parseInt(req.body.torneioId);
    const fase = parseInt(req.body.fase);

    if (req.user.level != 5 && req.user.level != 10) {
      throw new Error('Não tem permissões para eliminar a fase');
    }

    const ultimaFase = await dbFunctions.getUltimaFase(torneioId, escalaoId);

    if (ultimaFase != fase) {
      throw new Error('Fase Inválida');
    }

    await dbFunctions.deleteFase(torneioId, escalaoId, ultimaFase);

    res.status(200).json({
      success: true,
      fase: fase,
      escalaoId: escalaoId
    });

  } catch (err) {
    res.status(200).json({
      success: false,
      errMsg: err.message
    });
  }
}

async function getEquipasSubstituicao(torneioId, escalaoId, fase) {
  try {
    const listaJogos = await dbFunctions.getAllJogosEscalaoFase(torneioId, escalaoId, fase);
    const listaEquipasComJogos = [];
    const listaEquipas = [];

    listaJogos.forEach((jogo) => {
      const indexEquipa1 = listaEquipasComJogos.findIndex((equipa) => equipa == jogo.equipa1Id);
      if (indexEquipa1 == -1) {
        listaEquipasComJogos.push(jogo.equipa1Id);
        listaEquipas.push({ jogoId: jogo.jogoId, equipaId: jogo.equipa1Id });
      }
      const indexEquipa2 = listaEquipasComJogos.findIndex((equipa) => equipa == jogo.equipa2Id);
      if (indexEquipa2 == -1) {
        listaEquipasComJogos.push(jogo.equipa2Id);
        listaEquipas.push({ jogoId: jogo.jogoId, equipaId: jogo.equipa2Id });
      }
    });

    const listaEquipasDB = await dbFunctions.getAllEquipasSubstituicao(torneioId, escalaoId, listaEquipasComJogos);

    listaEquipasDB.forEach((equipa) => {
      const _equipaIndex = listaEquipas.findIndex((_equipa) => _equipa.equipaId == equipa.equipaId);
      if (_equipaIndex != -1) {
        const restantesDados = {
          primeiroElemento: equipa.primeiroElemento,
          segundoElemento: equipa.segundoElemento,
          localidade: equipa.localidade.nome,
        };
        Object.assign(listaEquipas[_equipaIndex], restantesDados);
      }
    });

    return listaEquipas;
  } catch (error) {
    throw error;
  }
}

exports.getAllEquipas = async (req, res) => {
  const escalaoId = req.params.escalaoId;
  let fase = req.params.fase;
  const torneio = await dbFunctions.getTorneioInfo();

  if (!escalaoId || !fase || !torneio) {
    return res.status(200).json({ success: false });
  }

  try {
    const listaEquipasASubstituir = await getEquipasSubstituicao(torneio.torneioId, escalaoId, fase);
    //fase = (fase - 1) > 0 ? (fase - 1) : 1;
    const listaFases = await dbFunctions.getAllFasesPorEscalao(torneio.torneioId, escalaoId);

    faseAnterior = listaFases.length >= 2 ? listaFases[listaFases.length - 2] : { fase: 1 };
    faseAnterior = faseAnterior.fase;

    const listaEquipasAColocar = await getEquipasSubstituicao(torneio.torneioId, escalaoId, faseAnterior);

    const listaDefinitivaEquipasASubstituir = listaEquipasAColocar.filter((equipa) => {
      const exiteEquipaNaListaDeSubstituicoes = listaEquipasASubstituir.findIndex((_equipa) => _equipa.equipaId == equipa.equipaId);
      return exiteEquipaNaListaDeSubstituicoes == -1 ? true : false;
    });

    return res.status(200).json({ success: true, equipasASubstituir: listaEquipasASubstituir, equipasAColocar: listaDefinitivaEquipasASubstituir });
  } catch (error) {
    return res.status(200).json({ success: false });
  }
}

exports.substituirEquipas = async (req, res) => {
  const jogoId = req.body.jogoId;
  const equipaIdSubstituir = req.body.equipaIdSubstituir;
  const equipaIdColocar = req.body.equipaIdColocar;
  const escalaoId = req.body.escalaoId;
  const torneio = await dbFunctions.getTorneioInfo();

  if (!jogoId || !equipaIdSubstituir || !equipaIdColocar || !escalaoId || !torneio) {
    return res.status(200).json({ success: false });
  }

  try {
    const jogo = await Jogos.findByPk(jogoId);

    if (!jogo) throw new Error();

    if (jogo.equipa1Id == equipaIdSubstituir) {
      jogo.equipa1Id = equipaIdColocar;
    } else if (jogo.equipa2Id == equipaIdSubstituir) {
      jogo.equipa2Id = equipaIdColocar;
    }

    await jogo.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(200).json({ success: false });
  }
}

exports.sincronizarTorneios = async (req, res) => {
  try {
    const url = req.session.syncUrl;
    await syncTorneios(url);
    req.flash("success", "Torneios sincronizados");
    return res.redirect("/admin/torneios");
  } catch (error) {
    req.flash("error", "Não foi sincronizar os torneios");
    res.redirect("/admin/torneios");
  }
}

exports.resetTorneio = async (req, res) => {
  try {
    const torneioId = parseInt(req.body.torneioId);
    const torneio = await Torneios.findByPk(torneioId);

    await Campos.destroy({
      where: { torneioId: torneio.torneioId }
    });

    await Jogos.destroy({
      where: { torneioId: torneio.torneioId }
    });

    await Interdicoes.destroy({
      where: { torneioId: torneio.torneioId }
    });

    res.status(200).json({
      success: true
    });

  } catch (error) {
    res.status(200).json({
      success: false,
      errMsg: error.message
    });
  }
}

exports.deleteEquipas = async (req, res) => {
  try {
    const torneioId = parseInt(req.body.torneioId);
    const torneio = await Torneios.findByPk(torneioId);

    await Equipas.destroy({
      where: { torneioId: torneio.torneioId }
    });

    res.status(200).json({
      success: true
    });

  } catch (error) {
    res.status(200).json({
      success: false,
      errMsg: error.message
    });
  }
}