const dbFunctions = require('./DBFunctions');
const sequelize = require('../helpers/database');

function avancaRodada(rodizio) {

    const numEquipasPorLinha = rodizio[0].length;
    const ultimoLinhaSuperior = rodizio[0][rodizio[0].length - 1];
    const primeiroLinhaInferior = rodizio[1][0];

    // Processa Linha Superior
    // Processamento por ordem inversa, ou seja, começa do fim do array para o principio
    for (let i = (numEquipasPorLinha - 1); i > 1; i--) {
        rodizio[0][i] = rodizio[0][i - 1];
    }
    rodizio[0][1] = primeiroLinhaInferior;

    // Processa Linha Inferior
    for (let i = 0; i < (numEquipasPorLinha - 1); i++) {
        rodizio[1][i] = rodizio[1][i + 1];
    }
    rodizio[1][numEquipasPorLinha - 1] = ultimoLinhaSuperior;
}

function processaInversao(rodadas) {
    // Inverte nos números impares e quando a rodade é impar inverte a primeira parelha
    for (let i = 0; i < rodadas.length; i++) {
        if (i % 2 != 0) {
            const temp = rodadas[i][0][0];
            rodadas[i][0][0] = rodadas[i][0][1];
            rodadas[i][0][1] = temp;
        }
        for (let k = 0; k < rodadas[i].length; k++) {
            if (k % 2 != 0) {
                const temp = rodadas[i][k][0];
                rodadas[i][k][0] = rodadas[i][k][1];
                rodadas[i][k][1] = temp;
            }
        }
    }
}

function processaEmparelhamento(numEquipas) {
    const par = (numEquipas % 2 == 0) ? true : false;
    const numRodadas = (par) ? numEquipas - 1 : numEquipas;
    const equipasPorlinha = Math.ceil(numEquipas / 2);

    // Constroi a base do Rodízio
    const rodizio = [];
    // linha Superior
    rodizio.push([]);
    // linha Inferior
    rodizio.push([]);

    // Preencher o rodízio
    for (let i = 0; i < equipasPorlinha; i++) {
        rodizio[0].push(i);

        if (i == 0) {
            if (par) {
                rodizio[1].push(numEquipas - (1 + i));
            } else {
                rodizio[1].push(null);
            }
        } else {
            if (par) {
                rodizio[1].push(numEquipas - (1 + i));
            } else {
                rodizio[1].push(numEquipas - i);
            }
        }
    }

    const rodadas = [];
    for (let i = 0; i < numRodadas; i++) {

        const _rodada = [];
        for (let k = 0; k < equipasPorlinha; k++) {
            if (rodizio[0][k] != null && rodizio[1][k] != null) {
                _rodada.push([rodizio[0][k], rodizio[1][k]]);
            }
        }
        rodadas.push(_rodada);
        avancaRodada(rodizio);
    }

    processaInversao(rodadas);

    const emparelhamento = [];
    for (let i = 0; i < numRodadas; i++) {
        for (let k = 0; k < rodadas[i].length; k++) {
            emparelhamento.push(rodadas[i][k]);
        }
    }

    return emparelhamento;
}

function shuffleLocalidades(listaLocalidades) {
    const localidades = [];

    while (listaLocalidades.length > 0) {
        let numLocalidades = listaLocalidades.length;
        const randomLocalidade = Math.floor(Math.random() * numLocalidades);

        localidades.push(listaLocalidades[randomLocalidade]);
        listaLocalidades.splice(randomLocalidade, 1);

    }
    return localidades;
}

function procuraEquipaIndex(listaEquipas, equipaId) {
    let k = -1;
    for (let i = 0; i < listaEquipas.length; i++) {
        if (listaEquipas[i].equipaId == equipaId) {
            return i;
        }
    }
    return k;
}

exports.distribuiEquipasPorCampos = async function (torneioId, escalao = 0) {
    try {
        // Inicializa a lista de escalões
        // Se o escalão estiver definido apenas esse escalão fica no array
        let escaloes = [];
        if (escalao == 0) {
            // Todos os escalões que têm equipas
            const listaEscaloes = await dbFunctions.getEscaloesComEquipas(torneioId);
            escaloes = listaEscaloes.map(escalao => escalao.escalaoId);
        } else {
            escaloes.push(parseInt(escalao));
        }

        const escaloesDistribuidos = [];
        //for await (const escalaoId of escaloes){
        for (const escalaoId of escaloes) {

            // 1. Obter a lista de equipas e respectivo número de equipas que corresponde ao tamanho do array da lista de equipas
            const equipas = await dbFunctions.getEquipasPorEscalao(torneioId, escalaoId);
            // Se não existirem equipas ou se o número de equipas for menor que que 6 não distribuir jogos
            // porque também não tem definido o número de campos
            if (!equipas || equipas.length < 6) {
                continue;
            }

            //const numEquipasPorEscalao = equipas.length;
            // Obtem o número de campos, mínimo de equipas e máximo de equipas para cada escalão
            const _camposInfo = dbFunctions.getNumeroCamposPorEscalao(torneioId, escalaoId);
            // 4. Por cada localidade distribuir as respectivas equipas pelos campos
            const _listaLocalidadesComNumEquipas = dbFunctions.getNumEquipasPorLocalidade(torneioId, escalaoId);

            let [{ numCampos }, listaLocalidadesComNumEquipas] = await Promise.all([_camposInfo, _listaLocalidadesComNumEquipas]);


            //Baralha as localidades para não haver sempre a mesma ordenação das equipas
            listaLocalidadesComNumEquipas = shuffleLocalidades(listaLocalidadesComNumEquipas);

            // Inicia a Array de campos
            let listaCampos = [];
            for (let i = 0; i < numCampos; i++) {
                listaCampos.push(new Array());
            }

            // Atribui as equipas aos campos
            let k = 0;
            for (const localidade of listaLocalidadesComNumEquipas) {
                const listaEquipasPorLocalidade = equipas.filter(el => el.localidadeId == localidade.localidadeId);
                for (const equipa of listaEquipasPorLocalidade) {
                    if (k >= numCampos) {
                        k = 0;
                    }

                    listaCampos[k].push(equipa);
                    k++;
                }
            }

            // Faz o emparelhamento das equipas por cada campo
            const listaJogos = [];
            for (i = 0; i < listaCampos.length; i++) {
                let emparelhamento = processaEmparelhamento(listaCampos[i].length);
                emparelhamento.forEach(par => {
                    listaJogos.push({
                        torneioId: torneioId,
                        escalaoId: escalaoId,
                        fase: 1,
                        campo: i + 1,
                        equipa1Id: listaCampos[i][par[0]].equipaId,
                        equipa2Id: listaCampos[i][par[1]].equipaId
                    })
                });
            }

            let transaction;
            try {
                transaction = await sequelize.transaction();
                await dbFunctions.createJogosBulkTransaction(listaJogos, transaction);
                await transaction.commit();
            } catch (err) {
                if (transaction) await transaction.rollback();
                throw err;
            }
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

exports.distribuiEquipasPorCampos_old = async function (torneioId, escalao = 0) {
    // Inicializa a lista de escalões
    // Se o escalão estiver definido apenas esse escalão fica no array
    let escaloes = [];
    if (escalao == 0) {
        // Todos os escalões que têm equipas
        const listaEscaloes = await dbFunctions.getEscaloesComEquipas(torneioId);
        escaloes = listaEscaloes.map(escalao => escalao.escalaoId);
    } else {
        escaloes.push(parseInt(escalao));
    }

    const escaloesDistribuidos = [];

    //for await (const escalaoId of escaloes){
    for (const escalaoId of escaloes) {

        // 1. Obter a lista de equipas e respectivo número de equipas que corresponde ao tamanho do array da lista de equipas
        const equipas = await dbFunctions.getEquipasPorEscalao(torneioId, escalaoId);
        const numEquipasPorEscalao = equipas.length;

        // Se só existem 2 equipas então o jogo é decisão do vencedor
        if (numEquipasPorEscalao == 2) {
            try {
                await dbFunctions.createJogo(torneioId, escalaoId, 100, 1, equipas[0].equipaId, equipas[1].equipaId);
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: true
                }
                escaloesDistribuidos.push(distribuido);
            } catch (err) {
                console.log("ERRO::Distribuição de Equipas:");
                console.log(err);
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: false
                }
                escaloesDistribuidos.push(distribuido);
            }

            // Existem mais que duas equipas, distribuir equipas
        } else if (numEquipasPorEscalao > 2) {

            // Obtem o número de campos, mínimo de equipas e máximo de equipas para cada escalão
            const _camposInfo = dbFunctions.getNumeroCamposPorEscalao(torneioId, escalaoId);
            // 4. Por cada localidade distribuir as respectivas equipas pelos campos
            const _listaLocalidades = dbFunctions.getAllLocalidadesID();

            let [camposInfo, listaLocalidades] = await Promise.all([_camposInfo, _listaLocalidades]);

            // Define o número de campos, min e max de equipas por campo
            const numCampos = (camposInfo !== null) ? camposInfo.numCampos : 0;

            //Baralha as localidades para não haver sempre a mesma ordenação das equipas
            listaLocalidades = shuffleLocalidades(listaLocalidades);

            // Verifica se existem equipas suficientes para preencher o número de campos do escalão
            // cumprindo o requisito do minímo de 3 equipas por campo
            if (numCampos * 3 > numEquipasPorEscalao) {
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: false
                }
                escaloesDistribuidos.push(distribuido);
                continue;
            }

            // Inicia a Array de campos
            let listaCampos = [];
            for (let i = 0; i < numCampos; i++) {
                listaCampos.push(new Array());
            }

            // Atribui as equipas aos campos
            let k = 0;
            for (const localidade of listaLocalidades) {
                const numEquipasPorLocalidade = await dbFunctions.getNumEquipasPorLocalidadeAndEscalao(torneioId, localidade.localidadeId, escalaoId);

                if (numEquipasPorLocalidade > 0) {
                    const listaEquipasPorLocalidade = await dbFunctions.getEquipasIDByLocalidadeAndEscalao(torneioId, localidade.localidadeId, escalaoId);
                    // Adiciona a equipa à lista de campos
                    for (const equipa of listaEquipasPorLocalidade) {
                        if (k >= numCampos) {
                            k = 0;
                        }

                        listaCampos[k].push(equipa);
                        k++;
                    }
                }
            }

            // Faz o emparelhamento das equipas por cada campo
            const listaJogos = [];
            for (i = 0; i < listaCampos.length; i++) {
                let emparelhamento = processaEmparelhamento(listaCampos[i].length);
                for (const par of emparelhamento) {
                    let equipa1 = listaCampos[i][par[0]];
                    let equipa2 = listaCampos[i][par[1]];

                    listaJogos.push(dbFunctions.createJogo(torneioId, escalaoId, 1, (i + 1), equipa1.equipaId, equipa2.equipaId));
                }
            }

            let transaction;
            try {
                transaction = await sequelize.transaction();
                // Regista os Jogos na Base de dados
                await Promise.all(listaJogos, { transaction });
                await transaction.commit();

                const distribuido = {
                    escalao: escalaoId,
                    sucesso: true
                }
                escaloesDistribuidos.push(distribuido);
            } catch (err) {
                await transaction.rollback();
                console.log("ERRO::Distribuição de Equipas:");
                console.log(err);
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: false
                }
                escaloesDistribuidos.push(distribuido);
            }
        } else {
            continue;
        }
    }
    // Retorna informação sobre que escalões foram distribuidos com sucesso e os que não foram
    return escaloesDistribuidos;
}

exports.processaEquipas = async function (torneioId, escalaoId, listaJogos) {
    try {
        const jogos = [];
        for (const jogo of listaJogos) {
            const jogoId = jogo.jogoId;
            const equipa1Id = jogo.equipa1Id;
            const equipa2Id = jogo.equipa2Id;

            const _equipa1Info = dbFunctions.getEquipa(torneioId, escalaoId, equipa1Id);
            const _equipa2Info = dbFunctions.getEquipa(torneioId, escalaoId, equipa2Id);

            const [equipa1Info, equipa2Info] = await Promise.all([_equipa1Info, _equipa2Info]);
            const equipas = {
                jogoId: jogoId,
                equipa1Id: equipa1Info.equipaId,
                equipa1PrimeiroElemento: equipa1Info.primeiroElemento,
                equipa1SegundoElemento: equipa1Info.segundoElemento,
                equipa1Localidade: equipa1Info.localidade.nome,
                equipa2Id: equipa2Info.equipaId,
                equipa2PrimeiroElemento: equipa2Info.primeiroElemento,
                equipa2SegundoElemento: equipa2Info.segundoElemento,
                equipa2Localidade: equipa2Info.localidade.nome,
            }
            jogos.push(equipas);
        }

        return jogos;
    } catch (err) {
        console.log(err);
        return Promise.reject();
    }
}

exports.verificaCamposCompletos = async function (listaCampos, torneioId, escalaoId, fase) {
    try {
        for (const campo of listaCampos) {
            // Otem o número total dos jogos do campo
            const _numTotalJogos = dbFunctions.getNumGamesPorCampo(torneioId, escalaoId, fase, campo.campo);
            // Obtem a lista de jogos que já foram jogados
            const _listaJogosFinalizados = dbFunctions.getAllGamesPlayed(torneioId, escalaoId, fase, campo.campo);

            const [numTotalJogos, listaJogosFinalizados] = await Promise.all([_numTotalJogos, _listaJogosFinalizados]);
            if (numTotalJogos - listaJogosFinalizados.length == 0) {
                campo.campoCompleto = true;
            } else {
                campo.campoCompleto = false;
            }
        }

        return listaCampos;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

exports.processaPontuacao = function (data) {
    let equipa1Pontos = 0;
    let equipa2Pontos = 0;
    let vitoriasEquipa1 = 0;
    let vitoriasEquipa2 = 0;

    if (data.parciaisData.equipa1.parcial1 == 30 && data.parciaisData.equipa2.parcial1 < 30) {
        vitoriasEquipa1++;
    } else if (data.parciaisData.equipa1.parcial1 < 30 && data.parciaisData.equipa2.parcial1 == 30) {
        vitoriasEquipa2++;
    }

    if (data.parciaisData.equipa1.parcial2 == 30 && data.parciaisData.equipa2.parcial2 < 30) {
        vitoriasEquipa1++;
    } else if (data.parciaisData.equipa1.parcial2 < 30 && data.parciaisData.equipa2.parcial2 == 30) {
        vitoriasEquipa2++;
    }

    if (data.parciaisData.equipa1.parcial3 != null && data.parciaisData.equipa2.parcial3 != null) {
        if (data.parciaisData.equipa1.parcial3 == 30 && data.parciaisData.equipa2.parcial3 < 30) {
            vitoriasEquipa1++;
        } else if (data.parciaisData.equipa1.parcial3 < 30 && data.parciaisData.equipa2.parcial3 == 30) {
            vitoriasEquipa2++;
        }
    }

    let resultado = vitoriasEquipa1 - vitoriasEquipa2;
    switch (resultado) {
        case 3:
        case 2: equipa1Pontos = 3;
            equipa2Pontos = 0;
            break;
        case 1: equipa1Pontos = 2;
            equipa2Pontos = 1;
            break;
        case -1: equipa1Pontos = 1;
            equipa2Pontos = 2;
            break;
        case -2:
        case -3: equipa1Pontos = 0;
            equipa2Pontos = 3;
            break;
    }

    data.parciaisData.equipa1.pontos = equipa1Pontos;
    data.parciaisData.equipa2.pontos = equipa2Pontos;

    return data;
}

const ordenaClassificacao = (classificacao, listaJogos) => {
    classificacao.sort((a, b) => {
        // Diferença de Pontos
        if (a.pontos > b.pontos) {
            return -1;
        } else if (a.pontos === b.pontos) {
            // Mesmos pontos, desempata por número de vitórias
            if (a.vitorias > b.vitorias) {
                return -1;
            } else if (a.vitorias === b.vitorias) {
                // Mesmo número de vitórias, desempata por resultado do confronto directo
                const jogo = listaJogos.find(elemento => {
                    return (elemento.equipa1Id == a.equipaId && elemento.equipa2Id == b.equipaId) || (elemento.equipa1Id == b.equipaId && elemento.equipa2Id == a.equipaId);
                });

                if (jogo.equipa1Pontos > jogo.equipa2Pontos) {
                    if (jogo.equipa1Id === a.equipaId) {
                        return -1;
                    } else {
                        return 1;
                    }
                } else {
                    if (jogo.equipa2Id === a.equipaId) {
                        return -1;
                    } else {
                        return 1;
                    }
                }
            } else {
                return 1;
            }
        } else {
            return 1;
        }
    });

    // Ordena caso o número de pontos e vitórias seja o mesmo
    // Critério de ordenação: Mais pontos acumulados tem precendencia
    classificacao.sort((a, b) => {
        if (a.pontos === b.pontos && a.vitorias === b.vitorias) {
            if (a.parciaisAcumulados > b.parciaisAcumulados) {
                return -1
            } else if (a.parciaisAcumulados < b.parciaisAcumulados) {
                return 1;
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    });
}

const processaEquipaNaClassificacao = (classificacao, index, equipa, jogo, parciais, fase) => {
    if (index != -1) {
        if (classificacao[index].equipaId == jogo.equipa1Id) {
            classificacao[index].vitorias = (jogo.equipa1Pontos > jogo.equipa2Pontos) ? classificacao[index].vitorias = classificacao[index].vitorias + 1 : classificacao[index].vitorias;
            classificacao[index].pontos = classificacao[index].pontos + jogo.equipa1Pontos;
        } else {
            classificacao[index].vitorias = (jogo.equipa2Pontos > jogo.equipa1Pontos) ? classificacao[index].vitorias = classificacao[index].vitorias + 1 : classificacao[index].vitorias;
            classificacao[index].pontos = classificacao[index].pontos + jogo.equipa2Pontos;
        }
    } else {
        const _equipa = {
            equipaId: equipa.equipaId,
            primeiroElemento: equipa.primeiroElemento,
            segundoElemento: equipa.segundoElemento,
            localidadeId: equipa.localidade.localidadeId,
            localidade: equipa.localidade.nome,
            parciaisAcumulados: (parciais) ? parciais.parciaisAcumulados : 0,
            pontos: (jogo.equipa1Id == equipa.equipaId) ? jogo.equipa1Pontos : jogo.equipa2Pontos
        }

        if (fase > 1) {
            if (jogo.equipa1Id == equipa.equipaId) {
                // Quando se ganha um jogo por 3-0 obteve-se 2 vitórias, ou seja, ganhou-se dois jogos 
                _equipa.vitorias = (jogo.equipa1Pontos != 3) ? jogo.equipa1Pontos : 2;
            } else {
                _equipa.vitorias = (jogo.equipa2Pontos != 3) ? jogo.equipa2Pontos : 2;
            }
        } else {
            //_equipa.vitorias = (jogo.equipa1Pontos > jogo.equipa2Pontos) ? 1 : 0;
            if (jogo.equipa1Id == equipa.equipaId) {
                _equipa.vitorias = (jogo.equipa1Pontos > jogo.equipa2Pontos) ? 1 : 0;
            } else {
                _equipa.vitorias = (jogo.equipa2Pontos > jogo.equipa1Pontos) ? 1 : 0;
            }
        }
        classificacao.push(_equipa);
    }
}

exports.processaClassificacao = async function (torneioId, escalaoId, fase, campo = 0) {
    try {
        const _listaCampos = await dbFunctions.getAllCamposPorEscalaoFase(torneioId, escalaoId, fase);

        // 1. Preencher um array com o mesmo número de campos que o escalão tem ocupados
        const listaCampos = [];
        if (campo == 0) {
            for (let i = 0; i < _listaCampos.length; i++) {
                listaCampos.push({ campo: _listaCampos[i].campo });
                if (fase == 100 && _listaCampos.length == 2) {
                    listaCampos[i].designacao = (i == 0) ? 'Final' : '3º e 4º Lugar';
                    listaCampos[i].inicioClassificacao = (i == 0) ? 1 : 3;
                }
            }
        } else {
            // Número do campo é passado como parametro
            listaCampos.push({ campo: campo });
            if (fase == 100 && _listaCampos.length == 2) {
                const index = _listaCampos.map(el => el.campo).indexOf(campo);
                listaCampos[0].designacao = (index == 0) ? 'Final' : '3º e 4º Lugar';
                listaCampos[0].inicioClassificacao = (index == 0) ? 1 : 3;
            }
        }

        const listaCompletaEquipas = await dbFunctions.getAllEquipasEscalao(torneioId, escalaoId);

        for (const campo of listaCampos) {
            const numCampo = campo.campo;

            // 1. Obter a lista de Jogos para cada campo
            const listaJogos = await dbFunctions.getAllGamesPorCampo(torneioId, escalaoId, fase, numCampo);
            const listaJogosParaParciais = listaJogos.map(el => el.jogoId);
            const parciaisAcumulados = await dbFunctions.getParciaisAcumulados(listaJogosParaParciais);

            campo.classificacao = [];
            const classificacao = campo.classificacao;

            // 2. Percorre a lista de jogos e coloca as equipas na lista de classificação
            for (const jogo of listaJogos) {
                const equipa1 = listaCompletaEquipas.find(el => el.equipaId == jogo.equipa1Id);
                const equipa2 = listaCompletaEquipas.find(el => el.equipaId == jogo.equipa2Id);
                const parciaisEquipa1 = parciaisAcumulados.find(el => el.equipaId == jogo.equipa1Id);
                const parciaisEquipa2 = parciaisAcumulados.find(el => el.equipaId == jogo.equipa2Id);

                //const posicaoEquipa1 = procuraEquipaIndex(classificacao, jogo.equipa1Id);
                const posicaoEquipa1 = classificacao.findIndex(el => el.equipaId == jogo.equipa1Id);
                processaEquipaNaClassificacao(classificacao, posicaoEquipa1, equipa1, jogo, parciaisEquipa1, fase);

                //const posicaoEquipa2 = procuraEquipaIndex(classificacao, jogo.equipa2Id);
                const posicaoEquipa2 = classificacao.findIndex(el => el.equipaId == jogo.equipa2Id);
                processaEquipaNaClassificacao(classificacao, posicaoEquipa2, equipa2, jogo, parciaisEquipa2, fase);
            }

            // 3. Ordena a Classificação
            ordenaClassificacao(classificacao, listaJogos);
        }
        return listaCampos;
    } catch (err) {
        console.log(err);
        throw err;
    }
}