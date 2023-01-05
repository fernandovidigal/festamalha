const util = require('../helpers/util');
const dbFunctions = require('../helpers/DBFunctions');
const torneioHelpers = require('../helpers/torneioHelperFunctions');

async function processaListaEquipasAgrupadasPorCampos(torneioId, escalaoId, fase, listaCampos) {
  try {
    const _listaEquipasEscalao = dbFunctions.getAllEquipasEscalao(torneioId, escalaoId);
    const _listaJogosEscalao = dbFunctions.getAllJogosEscalaoFase(torneioId, escalaoId, fase);
    const [listaEquipasEscalao, listaJogosEscalao] = await Promise.all([_listaEquipasEscalao, _listaJogosEscalao]);

    const listaEquipasId = listaEquipasEscalao.map((equipa) => equipa.equipaId);

    for (const campo of listaCampos) {
      campo.equipasIds = new Set();
      const listaJogosPorCampo = listaJogosEscalao.filter((jogo) => jogo.campo == campo.campo);

      for (const jogo of listaJogosPorCampo) {
        // Equipa 1
        if (!campo.equipasIds.has(jogo.equipa1Id)) {
          campo.equipasIds.add(jogo.equipa1Id);
          const index = listaEquipasId.indexOf(jogo.equipa1Id);
          const _equipa = {
            equipaId: jogo.equipa1Id,
            primeiroElemento: listaEquipasEscalao[index].primeiroElemento,
            segundoElemento: listaEquipasEscalao[index].segundoElemento,
            localidade: listaEquipasEscalao[index].localidade.nome,
          };
          campo.listaEquipas.push(_equipa);
        }

        // Equipa 2
        if (!campo.equipasIds.has(jogo.equipa2Id)) {
          campo.equipasIds.add(jogo.equipa2Id);
          const index = listaEquipasId.indexOf(jogo.equipa2Id);
          const _equipa = {
            equipaId: jogo.equipa2Id,
            primeiroElemento: listaEquipasEscalao[index].primeiroElemento,
            segundoElemento: listaEquipasEscalao[index].segundoElemento,
            localidade: listaEquipasEscalao[index].localidade.nome,
          };
          campo.listaEquipas.push(_equipa);
        }
      }
    }
    return listaCampos;
  } catch (err) {
    return Promise.reject(err);
  }
}

exports.mostraListagens = async (req, res) => {
  const torneio = await dbFunctions.getTorneioInfo();

  if (!torneio) {
    return res.render('includes/noTorneio', { breadcrumbs: req.breadcrumbs() });
  }

  const _listaEscaloes = await dbFunctions.getEscaloesComEquipas(torneio.torneioId);
  const _listaEscaloesComJogos = await dbFunctions.getAllEscaloesComJogos(torneio.torneioId);
  const _listaLocalidadesComEquipas = await dbFunctions.getAllLocalidadesComEquipas(torneio.torneioId);

  const [listaEscaloes, listaEscaloesComJogos, listaLocalidadesComEquipas] = await Promise.all([_listaEscaloes, _listaEscaloesComJogos, _listaLocalidadesComEquipas]);

  listaLocalidadesComEquipas.sort((a, b) => {
    return a['localidade.nome'].localeCompare(b['localidade.nome']);
  });

  res.render('listagens/index', {
    torneio: torneio,
    escaloes: listaEscaloes,
    escaloesComJogos: listaEscaloesComJogos,
    localidades: listaLocalidadesComEquipas,
    breadcrumbs: req.breadcrumbs(),
  });
};

// API
exports.getFases = async (req, res) => {
  try {
    const torneio = await dbFunctions.getTorneioInfo();
    const escalaoId = parseInt(req.params.escalao);

    const response = {
      success: false,
    };

    if (!torneio) {
      response.errMsg = 'Não foi possível obter dados.';
      return res.status(200).json(response);
    }

    let listaFases = await dbFunctions.getAllFasesPorEscalao(torneio.torneioId, escalaoId);
    listaFases = listaFases.map((_fase) => _fase.fase);

    if (listaFases.length > 0) {
      response.success = true;
      response.listaFases = listaFases;
    } else {
      response.errMsg = 'Não existem fases para o escalão selecionado.';
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

exports.getCampos = async (req, res) => {
  try {
    const torneio = await dbFunctions.getTorneioInfo();
    const escalaoId = parseInt(req.params.escalao);
    const fase = parseInt(req.params.fase);

    const response = {
      success: false,
    };

    if (!torneio) {
      response.errMsg = 'Não foi possível obter dados.';
      return res.status(200).json(response);
    }

    const listaCampos = await dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);

    if (fase == 100 && listaCampos.length == 2) {
      listaCampos[0].designacao = 'Final';
      listaCampos[1].designacao = '3º e 4º Lugar';
    }

    if (listaCampos.length > 0) {
      response.success = true;
      response.listaCampos = listaCampos;
    } else {
      response.errMsg = 'Não existem campos para esta fase.';
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

exports.getEquipas = async (req, res) => {
  try {
    const torneio = await dbFunctions.getTorneioInfo();
    const escalaoId = parseInt(req.params.escalao);

    const response = {
      success: false,
    };

    if (!torneio) {
      response.errMsg = 'Não foi possível obter dados.';
      return res.status(200).json(response);
    }

    let listaEquipas = await dbFunctions.getAllEquipas(torneio.torneioId, escalaoId);

    if (listaEquipas.length > 0) {
      response.success = true;
      response.listaEquipas = listaEquipas;
    } else {
      response.errMsg = 'Não existem equipas para este escalão.';
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

exports.getListaEquipasPorConcelho = async (req, res) => {
  try {
    const localidadeId = parseInt(req.params.localidadeId);
    const torneio = await dbFunctions.getTorneioInfo();

    const response = {
      success: false,
    };

    if (!torneio || !localidadeId) {
      response.errMsg = 'Não foi possível obter dados.';
      return res.status(200).json(response);
    }

    const _localidade = dbFunctions.getLocalidade(localidadeId);
    const _listaEquipas = dbFunctions.getAllEquipasTodasLocalidades(torneio.torneioId, localidadeId);
    const _numEquipasPorEscalao = dbFunctions.getNumEquipasPorCadaEscalaoListagens(torneio.torneioId, localidadeId);

    const [localidade, listaEquipas, numEquipasPorEscalao] = await Promise.all([_localidade, _listaEquipas, _numEquipasPorEscalao]);

    if (listaEquipas.length > 0) {
      torneio.escalao = localidade.nome;

      response.success = true;
      response.data = {
        torneio,
        localidade,
        listaEquipas,
        numEquipasPorEscalao,
      };
    } else {
      response.errMsg = 'Não existem equipas registadas para a Localidade selecionada';
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

exports.getNumEquipasPorConcelho = async (req, res) => {
  try {
    const escalaoId = parseInt(req.params.escalao);
    const torneioInfo = dbFunctions.getTorneioInfo();
    const escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
    const [torneio, escalao] = await Promise.all([torneioInfo, escalaoInfo]);

    const response = {
      success: false,
    };

    if (!torneio || !escalao) {
      response.errMsg = 'Não foi possível obter dados.';
      return res.status(200).json(response);
    }

    const equipasPorConcelho = await dbFunctions.getNumEquipasPorConcelhoInfo(torneio.torneioId, escalaoId);

    util.sort(equipasPorConcelho);

    if (equipasPorConcelho.length > 0) {
      response.success = true;
      response.torneio = {
        designacao: torneio.designacao,
        localidade: torneio.localidade,
        escalao: escalao.designacao,
        ano: torneio.ano,
        sexo: escalao.sexo == 1 ? 'Masculino' : 'Feminino',
      };

      response.numEquipas = equipasPorConcelho;

      let total = 0;
      equipasPorConcelho.forEach((equipa) => (total += equipa.numEquipas));
      response.total = total;
    } else {
      response.errMsg = 'Não existem equipas registadas neste torneio';
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

exports.getEquipasAgrupadasPorCampos = async (req, res) => {
  try {
    const escalaoId = parseInt(req.params.escalao);
    const fase = parseInt(req.params.fase);
    const campo = parseInt(req.params.campo) || 0;
    const torneioInfo = dbFunctions.getTorneioInfo();
    const escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
    const [torneio, escalao] = await Promise.all([torneioInfo, escalaoInfo]);
    let numCampos = [];

    const response = {
      success: false,
    };

    if (!torneio || !escalao) {
      response.errMsg = 'Não foi possível obter dados.';
      return res.status(200).json(response);
    }

    // 2. Verificar o número de campos para o escalão e fase
    let listaCampos = await dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);
    if (campo == 0) {
      for (let i = 0; i < listaCampos.length; i++) {
        numCampos.push(JSON.parse(JSON.stringify(listaCampos[i])));
        if (fase == 100 && listaCampos.length == 2) {
          numCampos[i].designacao = i == 0 ? 'Final' : '3º e 4º Lugar';
        }
        numCampos[i].listaEquipas = [];
      }
    } else {
      numCampos.push({ campo: campo });
      if (fase == 100 && listaCampos.length == 2) {
        const index = listaCampos.map((el) => el.campo).indexOf(campo);
        numCampos[0].designacao = index == 0 ? 'Final' : '3º e 4º Lugar';
      }
      numCampos[0].listaEquipas = [];
    }

    if (numCampos.length > 0) {
      await processaListaEquipasAgrupadasPorCampos(torneio.torneioId, escalaoId, fase, numCampos)
        .then((_listaCampos) => {
          response.success = true;
          response.torneio = {
            designacao: torneio.designacao,
            localidade: torneio.localidade,
            ano: torneio.ano,
            escalao: escalao.designacao,
            sexo: escalao.sexo == 1 ? 'Masculino' : 'Feminino',
          };
          response.listaCampos = _listaCampos;
          response.fase = fase;
        })
        .catch((err) => {
          console.log(err);
          response.errMsg = 'Não foi possível obter os dados das equipas por campos.';
        });
    } else {
      response.errMsg = 'Não existem campos com jogos atribuídos.';
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

exports.getFichasJogo = async (req, res) => {
  try {
    const escalaoId = parseInt(req.params.escalao);
    const campo = parseInt(req.params.campo);
    const fase = parseInt(req.params.fase) || 1;
    const torneioInfo = dbFunctions.getTorneioInfo();
    const escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
    const [torneio, escalao] = await Promise.all([torneioInfo, escalaoInfo]);
    let listaJogos = [];
    let listaCampos = [];

    const response = {
      success: false,
    };

    if (!torneio || !escalao) {
      response.errMsg = 'Não foi possível obter dados.';
      return res.status(200).json(response);
    }

    const _listaCampos = await dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);
    // Todos os campos
    if (campo == 0) {
      listaJogos = await dbFunctions.getAllJogosEscalaoFase(torneio.torneioId, escalaoId, fase);
      for (let i = 0; i < _listaCampos.length; i++) {
        listaCampos.push(JSON.parse(JSON.stringify(_listaCampos[i])));
        if (fase == 100 && _listaCampos.length == 2) {
          listaCampos[i].designacao = i == 0 ? 'Final' : '3º e 4º Lugar';
        }
      }
    } else {
      // Foi indicado o número do campo
      listaCampos.push({ campo: campo });
      listaJogos = await dbFunctions.getAllJogosEscalaoFaseCampo(torneio.torneioId, escalaoId, fase, campo);
      if (fase == 100 && _listaCampos.length == 2) {
        const index = _listaCampos.map((el) => el.campo).indexOf(campo);
        listaCampos[0].designacao = index == 0 ? 'Final' : '3º e 4º Lugar';
      }
    }

    if (listaJogos.length > 0) {
      response.torneio = {
        designacao: torneio.designacao,
        localidade: torneio.localidade,
        ano: torneio.ano,
        escalao: escalao.designacao,
        sexo: escalao.sexo == 1 ? 'Masculino' : 'Feminino',
      };

      response.campos = [];
      listaCampos.forEach((campo) => {
        const _listaJogosCampo = listaJogos.filter((jogo) => jogo.campo == campo.campo);
        campo.listaJogos = _listaJogosCampo;
        response.campos.push(campo);
      });
      response.success = true;
    } else {
      response.errMsg = 'Não existem jogos para os campos selecionados.';
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

exports.getClassificacao = async (req, res) => {
  try {
    const escalaoId = parseInt(req.params.escalao);
    const campo = parseInt(req.params.campo);
    const fase = parseInt(req.params.fase) || 1;
    const torneioInfo = dbFunctions.getTorneioInfo();
    const escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
    const [torneio, escalao] = await Promise.all([torneioInfo, escalaoInfo]);

    const response = {
      success: false,
    };

    if (!torneio || !escalao) {
      response.errMsg = 'Não foi possível obter dados.';
      return res.status(200).json(response);
    }

    const listaCampos = await torneioHelpers.processaClassificacao(torneio.torneioId, escalaoId, fase, campo);

    if (listaCampos.length > 0) {
      response.torneio = {
        designacao: torneio.designacao,
        localidade: torneio.localidade,
        ano: torneio.ano,
        escalao: escalao.designacao,
        sexo: escalao.sexo == 1 ? 'Masculino' : 'Feminino',
      };

      response.listaCampos = listaCampos;
      response.success = true;
    } else {
      response.errMsg = 'Não existem jogos para os campos selecionados.';
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
