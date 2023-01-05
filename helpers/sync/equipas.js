const axios = require('axios');
const dbFunctions = require('../DBFunctions');
const Equipas = require('../../models/Equipas');
const { checkInsert, checkUpdate, checkDelete } = require('./functions');
const { last } = require('lodash');

const apiKey = 'LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy';

const getEquipasNum = async (torneioId, escaloes) => {
    const equipasNum = {};

    for await (const escalao of escaloes){
        let lastEquipaID = await dbFunctions.getLastEquipaID(torneioId, escalao.escalaoId) || 0;
        const obj = {
            [escalao.escalaoId]: lastEquipaID
        }
        Object.assign(equipasNum, obj);
    }

    return equipasNum;
}

exports.syncEquipas = async (url) => {
    try {
        const torneio = await dbFunctions.getTorneioInfo();

        const _responseWeb = axios.get(`${url}equipas/get.php?key=${apiKey}&torneio=${torneio.uuid}`);
        const _equipasApp = dbFunctions.getAllEquipasInfo(torneio.torneioId);
        const _localidades = dbFunctions.getAllLocalidades();
        const _escaloes = dbFunctions.getAllEscaloes();

        const [responseWeb, equipasApp, localidadesInfo, escaloesInfo] = await Promise.all([_responseWeb, _equipasApp, _localidades, _escaloes]);
        if (!responseWeb.data.sucesso){
            throw new Error();
        }

        const equipasWeb = responseWeb.data.data;

        // Verifica que equipas são para inserir, ou seja, não existem localmente
        const equipasInserir = checkInsert(equipasWeb, equipasApp);

        // Verifica que equipas são para actualizar, ou seja, existem localmente (UUID) mas
        // o hash é diferente
        const equipasUpdate = checkUpdate(equipasWeb, equipasApp);

        const equipasNum = await getEquipasNum(torneio.torneioId, escaloesInfo);
        const localidades = {};
        localidadesInfo.forEach(localidade => {
            Object.assign(localidades, {[localidade.uuid]: localidade.localidadeId});
        });

        const escaloes = {};
        escaloesInfo.forEach(escalao => {
            Object.assign(escaloes, {[escalao.uuid]: escalao.escalaoId});
        });
    
        // Inserir as localidades na Base de Dados local
        const ListaEquipasInserir = [];
        equipasInserir.forEach(equipa => {
            const escalaoId = escaloes[equipa.escalaoUUID];
            equipasNum[escalaoId] = equipasNum[escalaoId] + 1;
            ListaEquipasInserir.push({
                equipaId: equipasNum[escalaoId],
                primeiroElemento: equipa.primeiroElemento,
                segundoElemento: equipa.segundoElemento,
                torneioId: torneio.torneioId,
                localidadeId: localidades[equipa.localidadeUUID],
                escalaoId: escalaoId,
                local: false,
                uuid: equipa.uuid,
                hash: equipa.hash
            });
        });

        // UpdateOnDuplicate UUID porque posso, com sync auto off, criar uma equipa
        // que já existe no servidor e assim quando sincronizar a equipa local fica
        // com o uuid da mesma equipa no servidor
        await Equipas.bulkCreate(ListaEquipasInserir, {
            updateOnDuplicate: ['uuid']
        });

        // Actualizar as equipas localmente
        const ListaEquipasUpdate = [];
        equipasUpdate.forEach(equipa => {
            const equipaApp = equipasApp.find(_equipa => _equipa.uuid == equipa.uuid);
            const propsToUpdate = {
                primeiroElemento: equipa.primeiroElemento,
                segundoElemento: equipa.segundoElemento,
                localidadeId: localidades[equipa.localidadeUUID],
                escalaoId: escaloes[equipa.escalaoUUID],
                hash: equipa.hash
            };
            if(escaloes[equipa.escalaoUUID] != equipaApp.escalaoId){
                const escalaoId = escaloes[equipa.escalaoUUID];
                equipasNum[escalaoId] = equipasNum[escalaoId] + 1;
                propsToUpdate.equipaId = equipasNum[escalaoId];
            }
            const updateStmt = Equipas.update(propsToUpdate, {
                where: {
                    uuid: equipa.uuid
                }
            });
            ListaEquipasUpdate.push(updateStmt);
        });
        // Processa todas as actualizações independentemente de alguma delas rejeitar
        await Promise.allSettled(ListaEquipasUpdate);

        const delete_equipasApp = dbFunctions.getAllEquipasInfo(torneio.torneioId);
        const delete_listaCompletaEquipasComJogos = dbFunctions.getAllEquipasComJogos(torneio.torneioId);

        const [deleteEquipasApp, equipasComJogos] = await Promise.all([delete_equipasApp, delete_listaCompletaEquipasComJogos]);
        // Adiciona a cada localidade a flag eliminável
        if(deleteEquipasApp.length > 0){
            deleteEquipasApp.forEach(equipa => {
                const equipaIndex = equipasComJogos.find(el => el.escalaoId == equipa.escalaoId && (el.equipa1Id == equipa.equipaId || el.equipa2Id == equipa.equipaId));
                equipa.eliminavel = (!equipaIndex) ? true : false;
            });
        }

        const equipasDelete = checkDelete(equipasWeb, deleteEquipasApp);
        const ListaEquipasDelete = [];
        equipasDelete.forEach(equipa => {
            const deleteStmt = Equipas.destroy({
                where: {
                    uuid: equipa.uuid
                }
            });
            ListaEquipasDelete.push(deleteStmt);
        });

        await Promise.allSettled(ListaEquipasDelete);

        return true;

    } catch (error) {
        throw error;
    }
}