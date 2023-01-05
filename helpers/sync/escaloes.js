const axios = require('axios');
const dbFunctions = require('../DBFunctions');
const Escaloes = require('../../models/Escaloes');
const { checkInsert, checkUpdate, checkDelete } = require('./functions');

const apiKey = 'LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy';

exports.syncEscaloes = async (url) => {
    try {
        const _responseWeb = axios.get(`${url}escaloes/get.php?key=${apiKey}`);
        const _escaloesApp = dbFunctions.getAllEscaloes();

        const [responseWeb, escaloesApp] = await Promise.all([_responseWeb, _escaloesApp]);
        if (!responseWeb.data.sucesso){
            throw new Error();
        }

        const escaloesWeb = responseWeb.data.data;

        // Verifica que escaloes são para inserir, ou seja, não existenm localmente
        const escaloesInserir = checkInsert(escaloesWeb, escaloesApp);

        // Verifica que escaloes são para actualizar, ou seja, existem localmente (UUID) mas
        // o hash é diferente
        const escaloesUpdate = checkUpdate(escaloesWeb, escaloesApp);

        // Inserir os Escaloes na Base de Dados local
        const ListaEscaloesInserir = [];
        escaloesInserir.forEach(escalao => {
            ListaEscaloesInserir.push({
                designacao: escalao.designacao,
                sexo: escalao.sexo,
                uuid: escalao.uuid,
                hash: escalao.hash
            });
        });

        // UpdateOnDuplicate UUID porque posso, com sync auto off, criar uma escalão
        // que já existe no servidor e assim quando sincronizar o escalão local fica
        // com o uuid do mesmo escalão no servidor
        await Escaloes.bulkCreate(ListaEscaloesInserir, {
            updateOnDuplicate: ['uuid']
        });

        // Actualizar os escaloes localmente
        const ListaEscaloesUpdate = [];
        escaloesUpdate.forEach(escalao => {
            const updateStmt = Escaloes.update({
                designacao: escalao.designacao,
                sexo: escalao.sexo,
                hash: escalao.hash
            }, {
                where: {
                    uuid: escalao.uuid
                }
            });
            ListaEscaloesUpdate.push(updateStmt);
        });
        // Processa todas as actualizações independentemente de alguma delas rejeitar
        await Promise.allSettled(ListaEscaloesUpdate);

        // Volta a requerer todos os escalões registados localmente para verificar quais foram eliminadas na web
        // uma vez que possivelmente foram adicionados novos escalões
        // Verifica também se podem ser eliminadas, ou seja, não podem ter jogo associados
        const delete_escaloesApp = dbFunctions.getAllEscaloes();
        const delete_listaEquipasComEscalao = dbFunctions.getAllEscaloesComEquipas();

        const [deleteEscaloesApp, escaloesComEquipas] = await Promise.all([delete_escaloesApp, delete_listaEquipasComEscalao ]);
        // Adiciona a cada escalão a flag eliminável
        if(deleteEscaloesApp.length > 0){
            deleteEscaloesApp.forEach(escalao => {
                const escalaoIndex = escaloesComEquipas.find(_escalao => _escalao.escalaoId == escalao.escalaoId);
                escalao.eliminavel = (!escalaoIndex) ? true : false;
            });
        }

        const escaloesDelete = checkDelete(escaloesWeb, deleteEscaloesApp);

        const ListaEscaloesDelete = [];
        escaloesDelete.forEach(escalao => {
            const deleteStmt = Escaloes.destroy({
                where: {
                    uuid: escalao.uuid
                }
            });
            ListaEscaloesDelete.push(deleteStmt);
        });

        await Promise.allSettled(ListaEscaloesDelete);

        return true;
    } catch (error) {
        throw error;
    }
}