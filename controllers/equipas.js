const Equipas = require('../models/Equipas');
const Localidades = require('../models/Localidades');
const Escaloes = require('../models/Escaloes');
const dbFunctions = require('../helpers/DBFunctions');
const sequelize = require('../helpers/database');
const { validationResult } = require('express-validator');
const util = require('../helpers/util');
const torneioHelpers = require('../helpers/torneioHelperFunctions');
const configFile = require('../helpers/configFunctions');
const crypto = require('crypto');
const axios = require('axios');
const Sequelize = require('sequelize');
const { syncEquipas } = require('../helpers/sync/equipas');

const faker = require('faker');
faker.locale = 'pt_PT';

function showValidationErrors(req, res, errors, page, oldData) {
  const localidadesInfo = dbFunctions.getLocalidadesInfo();
  const escaloesInfo = dbFunctions.getEscaloesInfo();
  const torneioInfo = dbFunctions.getTorneioInfo();

  Promise.all([localidadesInfo, escaloesInfo, torneioInfo])
    .then(async ([localidades, escaloes, torneio]) => {
      if (localidades.length > 0 && escaloes.length > 0) {
        util.sort(localidades);
        const listaEscaloes = await processaListaEscaloes(escaloes, torneio.torneioId);
        return res.render('equipas/' + page, { validationErrors: errors.array({ onlyFirstError: true }), localidades: localidades, escaloes: listaEscaloes, equipa: oldData, torneio: torneio, breadcrumbs: req.breadcrumbs() });
      } else {
        req.flash('error', 'Não foi possível obter dados dos escalões e/ou localidades.');
        return res.redirect('/equipas');
      }
    })
    .catch((err) => {
      req.flash('error', 'Não foi possível obter dados dos escalões e/ou localidades.');
      return res.redirect('/equipas');
    });
}

// Gera um array com a lista de equipas unicas com jogos
function geraListaEquipasUnicasComJogos(listaCompletaEquipasComJogos) {
  const listaFinal = [];
  for (const jogo of listaCompletaEquipasComJogos) {
    const escalao = listaFinal.find((el) => el.escalaoId == jogo.escalaoId);
    if (escalao) {
      escalao.listaEquipasComJogos.add(jogo.equipa1Id);
      escalao.listaEquipasComJogos.add(jogo.equipa2Id);
    } else {
      const _escalao = {
        escalaoId: jogo.escalaoId,
        listaEquipasComJogos: new Set(),
      };
      _escalao.listaEquipasComJogos.add(jogo.equipa1Id);
      _escalao.listaEquipasComJogos.add(jogo.equipa2Id);
      listaFinal.push(_escalao);
    }
  }
  return listaFinal;
}

function geraPaginacao(total, perPage, page) {
  const numPages = Math.ceil(total / perPage);
  const paginas = [];

  if (numPages <= 7) {
    // insere no array as 7 páginas
    for (let i = 1; i <= numPages; i++) {
      paginas.push(i);
    }
  } else {
    const nextOffset = numPages - page;
    let prevOffset = 0;
    if (nextOffset >= 3) {
      if (page > 3) {
        for (let i = page - 3; i <= page + 3; i++) {
          paginas.push(i);
        }
      } else {
        for (let i = 1; i <= 7; i++) {
          paginas.push(i);
        }
      }
    } else {
      prevOffset = 7 - nextOffset - 1;
      for (let i = page - prevOffset; i <= page + nextOffset; i++) {
        paginas.push(i);
      }
    }
  }

  return paginas;
}

async function processaListaEscaloes(escaloes, torneioId) {
  // Exclui da lista de esclões os escalões que já tenham jogos distribuídos
  // Se já existe jogos distribuídos não é possível adicionar mais equipas
  const listaEscaloes = [];
  const listaEscaloesComJogos = await dbFunctions.getNumJogosDeCadaEscalao(torneioId);
  for (const escalao of escaloes) {
    const _escalaoComJogos = listaEscaloesComJogos.find((el) => el.escalaoId == escalao.escalaoId);
    if (!_escalaoComJogos) {
      listaEscaloes.push(escalao);
    }
  }

  return listaEscaloes;
}

async function processaPercurso(torneioId, equipaId, escalaoId) {
  const _jogos = dbFunctions.getAllJogos(torneioId, equipaId, escalaoId);
  const _equipas = dbFunctions.getAllEquipas(torneioId, escalaoId);

  const [jogos, equipas] = await Promise.all([_jogos, _equipas]);

  const _jogosId = new Set(jogos.map((el) => el.jogoId));
  const jogosId = [..._jogosId];
  const _fases = new Set(jogos.map((el) => el.fase));
  const fases = [..._fases];

  const listaFases = [];

  for (const fase of fases) {
    const _jogo = jogos.find((jogo) => jogo.fase == fase);

    const faseActual = {
      fase: fase,
      campo: _jogo.campo,
      jogos: [],
    };

    // PROCESSA A CLASSIFICAÇÃO
    const _classificacao = await torneioHelpers.processaClassificacao(torneioId, escalaoId, fase, _jogo.campo);

    const posicao = _classificacao[0].classificacao.map((el) => el.equipaId).indexOf(equipaId);
    const classificacao = {
      posicao: posicao + 1,
      vitorias: _classificacao[0].classificacao[posicao].vitorias,
      pontos: _classificacao[0].classificacao[posicao].pontos,
    };
    faseActual.classificacao = classificacao;

    // PROCESSA JOGOS
    const parciais = await dbFunctions.getAllParciais(jogosId);

    //const parciais = await
    for (const jogo of jogos) {
      if (jogo.fase == fase) {
        // Equipas
        const equipa1 = equipas.find((el) => el.equipaId == jogo.equipa1Id);
        const equipa2 = equipas.find((el) => el.equipaId == jogo.equipa2Id);
        const _jogo = {
          equipas: [equipa1, equipa2],
        };

        // Parciais
        const parciaisEquipa1 = parciais.find((el) => el.jogoId == jogo.jogoId && el.equipaId == equipa1.equipaId);
        const parciaisEquipa2 = parciais.find((el) => el.jogoId == jogo.jogoId && el.equipaId == equipa2.equipaId);
        _jogo.parciais = [parciaisEquipa1, parciaisEquipa2];

        // Pontuação
        _jogo.pontos = [jogo.equipa1Pontos, jogo.equipa2Pontos];

        if (parciaisEquipa1 && parciaisEquipa2) {
          faseActual.jogos.push(_jogo);
        }
      }
    }

    listaFases.push(faseActual);
  }

  return listaFases;
}

/*async function processaPercurso_old(torneioId, equipaId, escalaoId){
    const _jogos = dbFunctions.getAllJogos(torneioId, equipaId, escalaoId);
    const _equipas = dbFunctions.getAllEquipas(torneioId, escalaoId);

    const [jogos, equipas] = await Promise.all([_jogos, _equipas]);

    console.log(jogos);

    const _jogosId = new Set(jogos.map(el => el.jogoId));
    const jogosId = [..._jogosId];
    const _fases = new Set(jogos.map(el => el.fase));
    const fases = [..._fases];
    const _campos = new Set(jogos.map(el => el.campo));
    const campos = [..._campos];

    const listaFases = [];

    for(const [index, fase] of fases.entries()){
        const faseActual = {
            fase: fase,
            campo: campos[index],
            jogos: []
        };

        // PROCESSA A CLASSIFICAÇÃO
        console.log(fase, campos[index]);
        const _classificacao = await torneioHelpers.processaClassificacao(torneioId, escalaoId, fase, campos[index]);

        const posicao = _classificacao[0].classificacao.map(el => el.equipaId).indexOf(equipaId);
        const classificacao = {
            posicao: posicao + 1,
            vitorias: _classificacao[0].classificacao[posicao].vitorias,
            pontos: _classificacao[0].classificacao[posicao].pontos
        }
        faseActual.classificacao = classificacao;

        // PROCESSA JOGOS
        const parciais = await dbFunctions.getAllParciais(jogosId);

        //const parciais = await
        for(const jogo of jogos){
            if(jogo.fase == fase){
                // Equipas
                const equipa1 = equipas.find(el => el.equipaId == jogo.equipa1Id);
                const equipa2 = equipas.find(el => el.equipaId == jogo.equipa2Id);
                const _jogo = {
                    equipas: [equipa1, equipa2]
                }

                // Parciais
                const parciaisEquipa1 = parciais.find(el => (el.jogoId == jogo.jogoId && el.equipaId == equipa1.equipaId));
                const parciaisEquipa2 = parciais.find(el => (el.jogoId == jogo.jogoId && el.equipaId == equipa2.equipaId));
                _jogo.parciais = [parciaisEquipa1, parciaisEquipa2];

                // Pontuação
                _jogo.pontos = [jogo.equipa1Pontos, jogo.equipa2Pontos];

                if(parciaisEquipa1 && parciaisEquipa2){
                    faseActual.jogos.push(_jogo);
                }
            }
        }

        listaFases.push(faseActual);
    }

    return listaFases;
}*/

const criarEquipa = async (equipa, torneio, options = {}) => {
  let lastEquipaID = (await dbFunctions.getLastEquipaID(torneio.torneioId, equipa.escalaoId)) || 0;
  lastEquipaID++;

  const equipasModel = await Equipas.create(
    {
      equipaId: lastEquipaID,
      torneioId: torneio.torneioId,
      primeiroElemento: equipa.primeiroElemento,
      segundoElemento: equipa.segundoElemento,
      localidadeId: equipa.localidadeId,
      escalaoId: equipa.escalaoId,
      local: equipa.local,
      hash: equipa.hash,
    },
    options
  );

  return equipasModel;
};

exports.getAllEquipas = async (req, res) => {
  try {
    const torneioInfo = dbFunctions.getTorneioInfo();
    const localidadesInfo = dbFunctions.getLocalidadesInfo();
    const escaloesInfo = dbFunctions.getEscaloesInfo();
    const page = parseInt(req.params.page) || 1;
    const perPage = parseInt(req.params.perPage) || 15;

    const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);

    if (!torneio) {
      return res.render('includes/noTorneio', { breadcrumbs: req.breadcrumbs() });
    }

    // Ordena correctamente as localidades
    util.sort(localidades);

    // Lista de Equipas Únicas Com Jogos
    const listaCompletaEquipasComJogos = await dbFunctions.getAllEquipasComJogos(torneio.torneioId);
    listaEquipasComJogos = geraListaEquipasUnicasComJogos(listaCompletaEquipasComJogos);

    const _listaEquipas = await dbFunctions.getAllEquipasPaginacao(torneio.torneioId, page, perPage);
    const listaEquipas = [];

    const numEquipas = await dbFunctions.getNumTotalEquipas(torneio.torneioId);
    const numPages = Math.ceil(numEquipas / perPage);

    // Processa a paginação
    const paginas = geraPaginacao(numEquipas, perPage, page);

    // Verificar se as equipas já estão atribuídas a jogos
    // Se estiverem então não é possível eliminar a equipa
    for (const equipa of _listaEquipas) {
      const _escalao = listaEquipasComJogos.find((el) => el.escalaoId == equipa.escalaoId);
      const _equipa = {
        rowId: equipa.rowId,
        equipaId: equipa.equipaId,
        primeiroElemento: equipa.primeiroElemento,
        segundoElemento: equipa.segundoElemento,
        localidade: equipa.localidade.nome,
        escalaoId: equipa.escalao.escalaoId,
        escalao: equipa.escalao.designacao,
        sexo: equipa.escalao.sexo,
        local: equipa.local,
        eliminavel: _escalao && _escalao.listaEquipasComJogos.has(equipa.equipaId) ? false : true,
      };
      listaEquipas.push(_equipa);
    }

    res.render('equipas/equipas', {
      torneio: torneio,
      localidades: localidades,
      escaloes: escaloes,
      equipas: listaEquipas,
      numEquipas: numEquipas,
      page: page,
      perPage: perPage,
      paginas: paginas,
      numPages: numPages,
      breadcrumbs: req.breadcrumbs(),
    });
  } catch (err) {
    console.log(err);
    req.flash('error', 'Não foi possível obter os dados das equipas.');
    res.redirect('../');
  }
};

exports.getEquipaToEdit = async (req, res) => {
  try {
    const equipaId = parseInt(req.params.id);
    const escalaoId = parseInt(req.params.escalao);

    const torneioInfo = dbFunctions.getTorneioInfo();
    const localidadesInfo = dbFunctions.getLocalidadesInfo();
    const escaloesInfo = dbFunctions.getEscaloesInfo();

    const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);

    const equipa = await dbFunctions.getEquipaFullDetails(torneio.torneioId, equipaId, escalaoId);
    if (!equipa) {
      req.flash('error', 'Equipa não existe');
      return res.redirect('/equipas');
    }

    // Verifica se a equipa já foi atribuida a algum jogo
    const numJogos = await dbFunctions.getNumJogosEquipa(torneio.torneioId, escalaoId, equipaId);
    equipa.escaloesEditaveis = numJogos == 0 ? true : false;

    // Para ser possível mudar de escalão
    equipa.oldEscalaoId = escalaoId;

    util.sort(localidades);
    // Exclui da lista de esclões os escalões que já tenham jogos distribuídos
    // Se já existe jogos distribuídos não é possível adicionar mais equipas
    const listaEscaloesDisponiveis = await processaListaEscaloes(escaloes, torneio.torneioId);
    // Adicionar o escalão actual caso não exista já na lista de escalões disponíveis
    const found = listaEscaloesDisponiveis.find((el) => el.escalaoId == equipa.escalaoId);
    if (!found) {
      listaEscaloesDisponiveis.push({
        escalaoId: equipa.escalao.escalaoId,
        designacao: equipa.escalao.designacao,
        sexo: equipa.escalao.sexo,
      });
    }

    listaEscaloesDisponiveis.sort((a, b) => (a.escalaoId > b.escalaoId ? 1 : -1));

    const percursoTorneio = await processaPercurso(torneio.torneioId, equipaId, escalaoId);

    req.breadcrumbs('Editar Equipa', '/equipas/editarEquipa');
    res.render('equipas/editarEquipa', {
      localidades: localidades,
      escaloes: listaEscaloesDisponiveis,
      torneio: torneio,
      equipa: equipa,
      percurso: percursoTorneio,
      breadcrumbs: req.breadcrumbs(),
    });
  } catch (err) {
    console.log(err);
    req.flash('error', 'Não foi possível obter os dados da equipa.');
    res.redirect('/equipas');
  }
};

exports.adicionarEquipa = async (req, res) => {
  try {
    const torneioInfo = dbFunctions.getTorneioInfo();
    const localidadesInfo = dbFunctions.getLocalidadesInfo();
    const escaloesInfo = dbFunctions.getEscaloesInfo();

    const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);

    if (localidades.length == 0 || escaloes.length == 0) throw new Error();

    util.sort(localidades);

    // Exclui da lista de escalões os escalões que já tenham jogos distribuídos
    // Se já existe jogos distribuídos não é possível adicionar mais equipas
    const listaEscaloes = await processaListaEscaloes(escaloes, torneio.torneioId);

    if (listaEscaloes.length == 0) {
      req.flash('warning', 'Todos os escalões já têm os jogos distribuídos.');
      res.redirect('/equipas');
    } else {
      req.breadcrumbs('Adicionar Equipa', '/equipas/adicionarEquipa');
      res.render('equipas/adicionarEquipa', { localidades: localidades, escaloes: listaEscaloes, torneio: torneio, breadcrumbs: req.breadcrumbs() });
    }
  } catch (err) {
    console.log(err);
    req.flash('error', 'Não foi possível obter dados dos escalões e/ou localidades.');
    res.redirect('/equipas');
  }
};

exports.createEquipa = async (req, res) => {
  const primeiroElemento = req.body.primeiroElemento.trim();
  const segundoElemento = req.body.segundoElemento.trim();
  const localidadeId = parseInt(req.body.localidade);
  const escalaoId = parseInt(req.body.escalao);
  const errors = validationResult(req);
  const syncWeb = req.body.syncWeb ? true : false;

  const inputData = {
    primeiroElemento: primeiroElemento,
    segundoElemento: segundoElemento,
    localidadeId: localidadeId,
    escalaoId: escalaoId,
  };

  const torneioInfo = dbFunctions.getTorneioInfo();
  const localidadesInfo = dbFunctions.getLocalidadesInfo();
  const escaloesInfo = dbFunctions.getEscaloesInfo();

  const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);
  util.sort(localidades);
  // Exclui da lista de escalões os escalões que já tenham jogos distribuídos
  // Se já existe jogos distribuídos não é possível adicionar mais equipas
  const listaEscaloes = await processaListaEscaloes(escaloes, torneio.torneioId);

  const equipaToHash = primeiroElemento + segundoElemento + localidadeId + escalaoId;
  const hash = crypto.createHash('sha512').update(equipaToHash.toUpperCase()).digest('hex');

  const equipa = {
    primeiroElemento: primeiroElemento,
    segundoElemento: segundoElemento,
    localidadeId: localidadeId,
    escalaoId: escalaoId,
    local: syncWeb ? false : true,
    hash: hash,
  };

  try {
    if (!errors.isEmpty()) {
      return showValidationErrors(req, res, errors, 'adicionarEquipa', inputData);
    }

    await criarEquipa(equipa, torneio);

    req.flash('success', 'Equipa adicionada');
    return res.redirect('/equipas');
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      const errors = [
        {
          msg: 'A equipa já se encontra registada neste torneio.',
        },
      ];
      req.breadcrumbs('Adicionar Equipa', '/equipas/adicionarEquipa');
      return res.render('equipas/adicionarEquipa', { errors: errors, equipa: inputData, localidades: localidades, escaloes: listaEscaloes, torneio: torneio, breadcrumbs: req.breadcrumbs() });
    } else {
      console.log(err);
      req.flash('error', 'Não foi possível registar a equipa');
      res.redirect('/equipas');
    }
  }
};

exports.updateEquipa = async (req, res) => {
  const equipaId = parseInt(req.params.id);
  const primeiroElemento = req.body.primeiroElemento.trim();
  const segundoElemento = req.body.segundoElemento.trim();
  const localidadeId = parseInt(req.body.localidade);
  const oldEscalaoId = parseInt(req.params.escalao);
  const escalaoId = parseInt(req.body.escalao);
  const errors = validationResult(req);
  req.breadcrumbs('Editar Equipa', '/equipas/editarEquipa');

  const oldData = {
    equipaId: equipaId,
    primeiroElemento: primeiroElemento,
    segundoElemento: segundoElemento,
    localidadeId: localidadeId,
    escalaoId: escalaoId,
    oldEscalaoId: oldEscalaoId,
  };

  if (!errors.isEmpty()) {
    return showValidationErrors(req, res, errors, 'editarEquipa', oldData);
  }

  try {
    const torneio = await dbFunctions.getTorneioInfo();
    const equipaToHash = primeiroElemento + segundoElemento + localidadeId + escalaoId;
    const hash = crypto.createHash('sha512').update(equipaToHash.toUpperCase()).digest('hex');

    const _equipa = dbFunctions.getSimpleEquipa(torneio.torneioId, equipaId, oldEscalaoId, false);
    const _localidade = Localidades.findByPk(localidadeId);
    const _escalao = Escaloes.findByPk(escalaoId);

    const [equipa, localidade, escalao] = await Promise.all([_equipa, _localidade, _escalao]);

    // Escalão diferente, é preciso fazer novo registo e eliminar o anterior
    if (escalaoId != oldEscalaoId) {
      // A equipa não é local, actualiza na plataforma web
      if (!equipa.local && req.session.activeConnection) {
        const response = await axios.post(`${req.session.syncUrl}equipas/changeEscalao.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
          primeiroElemento: primeiroElemento,
          segundoElemento: segundoElemento,
          torneioUUID: torneio.uuid,
          localidadeUUID: localidade.uuid,
          escalaoUUID: escalao.uuid,
          hash: hash,
          equipaUUID: equipa.uuid,
        });

        if (!response.data.sucesso) {
          throw new Error();
        }
      }

      let lastEquipaID = (await dbFunctions.getLastEquipaID(torneio.torneioId, escalaoId)) || 0;
      lastEquipaID++;

      await Equipas.update(
        {
          equipaId: lastEquipaID,
          primeiroElemento: primeiroElemento,
          segundoElemento: segundoElemento,
          localidadeId: localidadeId,
          escalaoId: escalaoId,
          hash: hash,
        },
        {
          where: {
            uuid: equipa.uuid,
            torneioId: torneio.torneioId,
          },
        }
      );

      req.flash('success', 'Equipa actualizada');
      return res.redirect('/equipas');
    } else {
      const transaction = await sequelize.transaction();

      try {
        // O escalão é o mesmo, basta actualizar a equipa
        (equipa.primeiroElemento = primeiroElemento), (equipa.segundoElemento = segundoElemento), (equipa.localidadeId = localidadeId), (equipa.hash = hash);

        await equipa.save({ transaction: transaction });

        if (!equipa.local && req.session.activeConnection) {
          const response = await axios.post(`${req.session.syncUrl}equipas/update.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
            primeiroElemento: primeiroElemento,
            segundoElemento: segundoElemento,
            torneioUUID: torneio.uuid,
            localidadeUUID: localidade.uuid,
            escalaoUUID: escalao.uuid,
            hash: hash,
            equipaUUID: equipa.uuid,
          });

          if (!response.data.sucesso) {
            throw new Error();
          }
        }

        await transaction.commit();
        req.flash('success', 'Equipa actualizada');
        return res.redirect('/equipas');
      } catch (error) {
        transaction.rollback();
        throw error;
      }
    }
  } catch (err) {
    console.log(err);
    req.flash('error', 'Não foi possível actualizar a equipa.');
    res.redirect('/equipas');
  }
};

exports.getEquipaToDelete = async (req, res) => {
  let response = { success: false };

  try {
    const equipaId = parseInt(req.params.equipaId);
    const escalaoId = parseInt(req.params.escalaoId);

    const torneio = await dbFunctions.getTorneioInfo();
    const equipa = await dbFunctions.getEquipaFullDetails(torneio.torneioId, equipaId, escalaoId);

    if (equipa) {
      (response.success = true),
        (response.equipa = {
          equipaId: equipa.equipaId,
          torneioId: equipa.torneioId,
          primeiroElemento: equipa.primeiroElemento,
          segundoElemento: equipa.segundoElemento,
          localidade: equipa.localidade.nome,
          sexo: equipa.escalao.sexo,
          escalao: equipa.escalao.designacao,
          escalaoId: equipa.escalao.escalaoId,
        });
    }
  } catch (err) {
    return res.status(200).json({ success: false });
  }

  return res.status(200).json(response);
};

exports.deleteEquipa = async (req, res) => {
  const equipaId = parseInt(req.body.equipaId);
  const torneioId = parseInt(req.body.torneioId);
  const escalaoId = parseInt(req.body.escalaoId);

  try {
    const equipa = await dbFunctions.getSimpleEquipa(torneioId, equipaId, escalaoId, false);
    if (!equipa.local && req.session.activeConnection) {
      const response = await axios.post(`${req.session.syncUrl}equipas/delete.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
        uuid: equipa.uuid,
      });

      if (!response.data.sucesso) {
        throw new Error();
      }
    }

    await equipa.destroy();

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(200).json({ success: false });
  }
};

exports.sincronizarEquipa = async (req, res) => {
  const uuid = req.params.uuid;

  try {
    if (req.session.activeConnection) {
      const equipa = await Equipas.findOne({
        where: { uuid: uuid },
        include: [{ model: Localidades }, { model: Escaloes }],
      });

      //console.log(equipa.localidade.uuid);

      const torneio = await dbFunctions.getTorneioInfo();
      /*const localidadesInfo = dbFunctions.getLocalidadesInfo();
            const escaloesInfo = dbFunctions.getEscaloesInfo();

            const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);

            // Obtem os UUIDs da localidade e do escalão
            const selectedLocalidade = localidades.find(localidade => localidade.localidadeId == equipa.localidadeId);
            const selectedEscalao = escaloes.find(escalao => escalao.escalaoId == equipa.escalaoId);*/

      const response = await axios.post(`${req.session.syncUrl}equipas/create.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
        primeiroElemento: equipa.primeiroElemento,
        segundoElemento: equipa.segundoElemento,
        torneioUUID: torneio.uuid,
        localidadeUUID: equipa.localidade.uuid,
        escalaoUUID: equipa.escalao.uuid,
        hash: equipa.hash,
      });

      // Pode ser retornado uma equipa (caso exista) ou o uuid (caso seja inserido)
      if (response.data.sucesso && (response.data.uuid || response.data.equipa)) {
        equipa.uuid = response.data.uuid || response.data.equipa.uuid;
        equipa.local = false;
        await equipa.save();
      } else {
        throw new Error('Não foi possível sincronizar a equipa com o servidor');
      }

      req.flash('success', 'Equipa sincronizada');
      return res.redirect('/equipas');
    } else {
      throw new Error('Não existe ligação activa');
    }
  } catch (error) {
    req.flash('error', 'Não foi possível sincronizar a equipa');
    res.redirect('/equipas');
  }
};

exports.sincronizarTodasEquipas = async (req, res) => {
  try {
    const url = req.session.syncUrl;
    await syncEquipas(url);
    req.flash('success', 'Equipas sincronizadas');
    return res.redirect('/equipas');
  } catch (error) {
    req.flash('error', 'Não foi sincronizar as equipas');
    res.redirect('/equipas');
  }
};

// Pesquisar Equipas
exports.searchEquipa = async (req, res) => {
  try {
    const equipaId = parseInt(req.body.pesquisaEquipaId);
    const escalaoId = parseInt(req.params.escalao);
    const localidadeId = parseInt(req.params.localidadeId) || 0;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = errors.array({ onlyFirstError: true })[0].msg;
      req.flash('error', error);
      return res.redirect('/equipas');
    } else {
      if (!escalaoId || !equipaId) throw new Error();

      const torneio = await dbFunctions.getTorneioInfo();
      const equipa = await dbFunctions.getEquipaFullDetails(torneio.torneioId, equipaId, escalaoId);

      const localidadesInfo = dbFunctions.getLocalidadesInfo();
      const escaloesInfo = dbFunctions.getEscaloesInfo();
      // Verifica se a equipa já está associada a jogos
      const _numJogos = dbFunctions.getNumJogosEquipa(torneio.torneioId, escalaoId, equipaId);

      const [localidades, escaloes, numJogos] = await Promise.all([localidadesInfo, escaloesInfo, _numJogos]);

      let searchedEquipa = [];

      if (equipa) {
        searchedEquipa.push({
          equipaId: equipa.equipaId,
          primeiroElemento: equipa.primeiroElemento,
          segundoElemento: equipa.segundoElemento,
          localidade: equipa.localidade.nome,
          escalao: equipa.escalao.designacao,
          sexo: equipa.escalao.sexo,
          eliminavel: numJogos == 0 ? true : false,
        });
      }

      util.sort(localidades);

      let i = escaloes.map((escalao) => escalao.escalaoId).indexOf(parseInt(escalaoId));
      const filtro = {
        escalaoId: escalaoId,
        escalao: i != -1 ? escaloes[i].designacao : '',
        sexo: i != -1 ? (escaloes[i].sexo == 1 ? 'Masculino' : 'Feminino') : '',
      };

      if (localidadeId != 0) {
        filtro.localidadeId = localidadeId;
        let i = localidades.map((localidade) => localidade.localidadeId).indexOf(parseInt(localidadeId));
        filtro.localidade = i != -1 ? localidades[i].nome : '';
      }

      res.render('equipas/equipas', {
        equipaId: equipaId,
        equipas: searchedEquipa,
        torneio: torneio,
        filtro: filtro,
        localidades: localidades,
        escaloes: escaloes,
        numEquipas: searchedEquipa.length,
        breadcrumbs: req.breadcrumbs(),
      });
    }
  } catch (err) {
    req.flash('error', 'Não foi possível pesquisar a equipa.');
    res.redirect('/equipas');
  }
};

// Filtrar Equipas
exports.filtrarEquipas = async (req, res) => {
  try {
    const localidadeId = parseInt(req.params.localidadeId);
    const escalaoId = parseInt(req.params.escalaoId);
    const page = parseInt(req.params.page) || 1;
    const perPage = parseInt(req.params.perPage) || 15;
    const torneio = await dbFunctions.getTorneioInfo();

    const filtro = {
      torneioId: torneio.torneioId,
    };

    if (!localidadeId && !escalaoId) {
      throw new Error();
    }

    if (localidadeId) {
      filtro.localidadeId = parseInt(localidadeId);
    }

    if (escalaoId) {
      filtro.escalaoId = parseInt(escalaoId);
    }

    const equipasInfo = dbFunctions.getAllEquipasPorFiltroPaginacao(filtro, page, perPage);
    const localidadesInfo = dbFunctions.getLocalidadesInfo();
    const escaloesInfo = dbFunctions.getEscaloesInfo();
    const _numEquipas = dbFunctions.getNumEquipasPorFiltro(filtro);

    const [_listaEquipas, localidades, escaloes, numEquipas] = await Promise.all([equipasInfo, localidadesInfo, escaloesInfo, _numEquipas]);

    util.sort(localidades);

    const numPages = Math.ceil(numEquipas / perPage);

    // Processa a paginação
    const paginas = geraPaginacao(numEquipas, perPage, page);

    // Lista de Equipas Únicas Com Jogos
    const listaCompletaEquipasComJogos = await dbFunctions.getAllEquipasComJogos(torneio.torneioId);
    listaEquipasComJogos = geraListaEquipasUnicasComJogos(listaCompletaEquipasComJogos);

    // Verificar se as equipas já estão atribuídas a jogos
    // Se estiverem então não é possível eliminar a equipa
    const listaEquipas = [];
    for (const equipa of _listaEquipas) {
      const _escalao = listaEquipasComJogos.find((el) => el.escalaoId == equipa.escalaoId);
      const _equipa = {
        equipaId: equipa.equipaId,
        primeiroElemento: equipa.primeiroElemento,
        segundoElemento: equipa.segundoElemento,
        localidade: equipa.localidade.nome,
        escalaoId: equipa.escalao.escalaoId,
        escalao: equipa.escalao.designacao,
        sexo: equipa.escalao.sexo,
        eliminavel: _escalao && _escalao.listaEquipasComJogos.has(equipa.equipaId) ? false : true,
      };

      // Verificar se existem jogos desta equipa
      listaEquipas.push(_equipa);
    }

    if (localidadeId) {
      let i = localidades.map((localidade) => localidade.localidadeId).indexOf(parseInt(localidadeId));
      filtro.localidade = i != -1 ? localidades[i].nome : '';
    }

    if (escalaoId) {
      let i = escaloes.map((escalao) => escalao.escalaoId).indexOf(parseInt(escalaoId));
      filtro.escalao = i != -1 ? escaloes[i].designacao : '';
      filtro.sexo = i != -1 ? (escaloes[i].sexo == 1 ? 'Masculino' : 'Feminino') : '';
    }

    res.render('equipas/equipas', {
      torneio: torneio,
      localidades: localidades,
      escaloes: escaloes,
      equipas: listaEquipas,
      numEquipas: numEquipas,
      filtro: filtro,
      page: page,
      perPage: perPage,
      paginas: paginas,
      numPages: numPages,
      breadcrumbs: req.breadcrumbs(),
    });
  } catch (err) {
    req.flash('error', 'Não foi possível filtrar equipas.');
    res.redirect('/equipas');
  }
};

// API
exports.listagemEquipas = async (req, res) => {
  try {
    const localidadeId = parseInt(req.params.localidade);
    const escalaoId = parseInt(req.params.escalao);
    const torneio = await dbFunctions.getTorneioInfo();
    const listaEquipas = [];
    const query = {
      torneioId: torneio.torneioId,
    };

    const response = {
      success: false,
    };

    if (!torneio) {
      response.errType = 'error';
      response.errMsg = 'Não foi possível obter os dados!';
      return res.status(200).json(response);
    } else {
      response.torneio = {
        designacao: torneio.designacao,
        localidade: torneio.localidade,
        ano: torneio.ano,
      };
    }

    if (localidadeId != 0) {
      query.localidadeId = localidadeId;
      response.localidade = await dbFunctions.getLocalidade(localidadeId);
    }

    if (escalaoId != 0) {
      query.escalaoId = escalaoId;
      response.escalao = await dbFunctions.getEscalao(escalaoId);
    }

    const _listaEquipas = await dbFunctions.getAllEquipasFullDetails(query);
    if (_listaEquipas.length > 0) {
      for (const equipa of _listaEquipas) {
        const _equipa = {
          equipaId: equipa.equipaId,
          primeiroElemento: equipa.primeiroElemento,
          segundoElemento: equipa.segundoElemento,
          localidade: equipa.localidade.nome,
          escalao: equipa.escalao.designacao,
          sexo: equipa.escalao.sexo == 1 ? 'Masculino' : 'Feminino',
        };
        listaEquipas.push(_equipa);
      }

      response.success = true;
      response.listaEquipas = listaEquipas;
    } else {
      response.errType = 'warning';
      response.errMsg = 'Não existem equipas!';
    }

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(200).json({
      success: false,
      errMsg: 'Ocorreu um erro. Por favor tente novamente.',
    });
  }
};

exports.getEscaloes = async (req, res) => {
  try {
    const torneioInfo = dbFunctions.getTorneioInfo();
    const escaloesInfo = dbFunctions.getEscaloesInfo();

    const [torneio, escaloes] = await Promise.all([torneioInfo, escaloesInfo]);

    if (escaloes.length == 0) throw new Error('Não existem escalões registados');

    // Exclui da lista de escalões os escalões que já tenham jogos distribuídos
    // Se já existe jogos distribuídos não é possível adicionar mais equipas
    const listaEscaloes = await processaListaEscaloes(escaloes, torneio.torneioId);

    return res.status(200).json({ success: true, escaloes: listaEscaloes, todos: escaloes.length == listaEscaloes.length ? true : false });
  } catch (error) {
    return res.status(200).json({ success: false });
  }
};

// Faker
exports.createEquipasAleatoriamente = async (req, res) => {
  try {
    const configData = await configFile.readConfigFile();

    if (!configData.faker) {
      req.flash('info', 'Gerar equipas aleatóriamente está DESACTIVADO');
      return res.redirect('/equipas');
    }

    const num = parseInt(req.params.num) || 0;
    const torneioInfo = dbFunctions.getTorneioInfo();
    const localidadesInfo = dbFunctions.getAllLocalidadesID();
    const escaloesInfo = dbFunctions.getEscaloesInfo();

    const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);

    const _listaLocalidades = localidades.map((localidade) => localidade.localidadeId);
    const _listaEscaloes = escaloes.map((escalao) => escalao.escalaoId);
    const listaEquipas = [];

    let listaEscaloes = await dbFunctions.getLastEquipaIDTodosEscaloes(torneio.torneioId);
    const listaEscaloesComJogos = await dbFunctions.getNumJogosDeCadaEscalao(torneio.torneioId);

    for (const escalao of _listaEscaloes) {
      const found = listaEscaloes.find((el) => el.escalaoId == escalao);
      if (!found) {
        listaEscaloes.push({
          escalaoId: escalao,
          lastId: 0,
        });
      }
    }

    listaEscaloes = listaEscaloes.filter((el) => -1 === listaEscaloesComJogos.findIndex((x) => x.escalaoId == el.escalaoId));

    for (let i = 0; i < num; i++) {
      const _escalao = listaEscaloes[Math.floor(Math.random() * listaEscaloes.length)];
      _escalao.lastId++;
      const primeiroElemento = faker.name.firstName() + ' ' + faker.name.lastName();
      const segundoElemento = faker.name.firstName() + ' ' + faker.name.lastName();
      const localidadeId = _listaLocalidades[Math.floor(Math.random() * _listaLocalidades.length)];
      const equipaToHash = primeiroElemento + segundoElemento + localidadeId + _escalao.escalaoId;
      const hash = crypto.createHash('sha512').update(equipaToHash.toUpperCase()).digest('hex');
      const equipa = {
        equipaId: _escalao.lastId,
        torneioId: torneio.torneioId,
        primeiroElemento: primeiroElemento,
        segundoElemento: segundoElemento,
        localidadeId: localidadeId,
        escalaoId: _escalao.escalaoId,
        hash: hash,
      };
      listaEquipas.push(equipa);
    }

    await Equipas.bulkCreate(listaEquipas);

    req.flash('success', `${listaEquipas.length} equipas adicionadas com sucesso.`);
    return res.redirect('/equipas');
  } catch (err) {
    console.log(err);
    req.flash('error', 'Não foi possível gerar equipas aleatóriamente.');
    res.redirect('/equipas');
  }
};

exports.createEquipasAleatoriamentePorEscalao = async (req, res) => {
  try {
    const configData = await configFile.readConfigFile();

    if (!configData.faker) {
      req.flash('info', 'Gerar equipas aleatóriamente está DESACTIVADO');
      return res.redirect('/equipas');
    }
    const escalaoId = parseInt(req.params.escalao);
    const num = parseInt(req.params.num) || 0;

    const torneioInfo = dbFunctions.getTorneioInfo();
    const localidadesInfo = dbFunctions.getAllLocalidadesID();

    const [torneio, localidades] = await Promise.all([torneioInfo, localidadesInfo]);

    const numJogos = await dbFunctions.getNumJogosPorEscalao(torneio.torneioId, escalaoId);
    if (numJogos > 0) {
      req.flash('warning', 'O escalão selecionado já iniciou a competição');
      return res.redirect('/equipas');
    }

    const listaLocalidades = localidades.map((localidade) => localidade.localidadeId);
    const listaEquipas = [];

    let lastEquipaID = (await dbFunctions.getLastEquipaID(torneio.torneioId, escalaoId)) || 0;
    for (let i = 0; i < num; i++) {
      lastEquipaID++;
      const primeiroElemento = faker.name.firstName() + ' ' + faker.name.lastName();
      const segundoElemento = faker.name.firstName() + ' ' + faker.name.lastName();
      const localidadeId = listaLocalidades[Math.floor(Math.random() * listaLocalidades.length)];
      const equipaToHash = primeiroElemento + segundoElemento + localidadeId + escalaoId;
      const hash = crypto.createHash('sha512').update(equipaToHash.toUpperCase()).digest('hex');
      const equipa = {
        equipaId: lastEquipaID,
        torneioId: torneio.torneioId,
        primeiroElemento: primeiroElemento,
        segundoElemento: segundoElemento,
        localidadeId: localidadeId,
        escalaoId: escalaoId,
        hash: hash,
      };
      listaEquipas.push(equipa);
    }

    await Equipas.bulkCreate(listaEquipas);

    req.flash('success', `${num} equipas adicionadas com sucesso.`);
    res.redirect('/equipas');
  } catch (err) {
    console.log(err);
    req.flash('error', 'Não foi possível gerar equipas aleatóriamente.');
    res.redirect('/equipas');
  }
};
