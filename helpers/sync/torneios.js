const axios = require('axios');
const dbFunctions = require('../DBFunctions');
const Torneios = require('../../models/Torneios');
const { checkInsert, checkUpdate, checkDelete } = require('./functions');

const apiKey = 'LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy';

exports.syncTorneios = async (url) => {
    try {
        const _responseWeb = axios.get(`${url}torneios/get.php?key=${apiKey}`);
        const _torneiosApp = dbFunctions.getAllTorneios();

        const [responseWeb, torneiosApp] = await Promise.all([_responseWeb, _torneiosApp]);
        if (!responseWeb.data.sucesso){
            throw new Error();
        }

        const torneiosWeb = responseWeb.data.data;

        // Verifica que torneios são para inserir, ou seja, não existem localmente
        const torneiosInserir = checkInsert(torneiosWeb, torneiosApp);

        // Verifica que torneios são para actualizar, ou seja, existem localmente (UUID) mas
        // o hash é diferente
        const torneiosUpdate = checkUpdate(torneiosWeb, torneiosApp);

        // Inserir os torneios na Base de Dados local
        const ListaTorneiosInserir = [];
        torneiosInserir.forEach(torneio => {
            ListaTorneiosInserir.push({
                designacao: torneio.designacao,
                localidade: torneio.localidade,
                ano: torneio.ano,
                uuid: torneio.uuid,
                hash: torneio.hash
            });
        });

        // UpdateOnDuplicate UUID porque posso, com sync auto off, criar um torneio
        // que já existe no servidor e assim quando sincronizar o torneio local fica
        // com o uuid do mesmo torneio no servidor
        await Torneios.bulkCreate(ListaTorneiosInserir, {
            updateOnDuplicate: ['uuid']
        });

        // Actualizar os torneios localmente
        const ListaTorneiosUpdate = [];
        torneiosUpdate.forEach(torneio => {
            const updateStmt = Torneios.update({
                designacao: torneio.designacao,
                localidade: torneio.localidade,
                ano: torneio.ano,
                hash: torneio.hash
            }, {
                where: {
                    uuid: torneio.uuid
                }
            });
            ListaTorneiosUpdate.push(updateStmt);
        });

        // Processa todas as actualizações independentemente de alguma delas rejeitar
        await Promise.allSettled(ListaTorneiosUpdate);

        // Volta a requerer todos os torneios registados localmente para verificar quais foram eliminadas na web
        // uma vez que possivelmente foram adicionados novos torneios
        // Verifica também se podem ser eliminadas, ou seja, não podem ter jogo associados
        const delete_torneiosApp = dbFunctions.getAllTorneios();
        const delete_listaTorneiosComEquipas = dbFunctions.getTorneiosComEquipas();
        const [deleteTorneiosApp, torneiosComEquipas] = await Promise.all([delete_torneiosApp, delete_listaTorneiosComEquipas]);
        // Adiciona a cada torneio a flag eliminável
        if(deleteTorneiosApp.length > 0){
            deleteTorneiosApp.forEach(torneio => {
                const escalaoIndex = torneiosComEquipas.find(el => el.torneioId == torneio.torneioId);
                torneio.eliminavel = (!escalaoIndex) ? true : false;
            });
        }

        const torneiosDelete = checkDelete(torneiosWeb, deleteTorneiosApp);
        const ListaTorneiosDelete = [];
        torneiosDelete.forEach(torneio => {
            const deleteStmt = torneios.destroy({
                where: {
                    uuid: torneio.uuid
                }
            });
            ListaTorneiosDelete.push(deleteStmt);
        });

        await Promise.allSettled(ListaTorneiosDelete);

        return true;
    } catch (error){
        throw error;
    }
}