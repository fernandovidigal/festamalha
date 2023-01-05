const axios = require('axios');
const dbFunctions = require('../DBFunctions');
const Localidades = require('../../models/Localidades');
const { checkInsert, checkUpdate, checkDelete } = require('./functions');

const apiKey = 'LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy';

exports.syncLocalidades = async (url) => {
    try {
        const _responseWeb = axios.get(`${url}localidades/get.php?key=${apiKey}`);
        const _localidadesApp = dbFunctions.getAllLocalidades();

        const [responseWeb, localidadesApp] = await Promise.all([_responseWeb, _localidadesApp]);
        if (!responseWeb.data.sucesso){
            throw new Error();
        }

        const localidadesWeb = responseWeb.data.data;

        // Verifica que localidades são para inserir, ou seja, não existem localmente
        const localidadesInserir = checkInsert(localidadesWeb, localidadesApp);

        // Verifica que localidades são para actualizar, ou seja, existem localmente (UUID) mas
        // o hash é diferente
        const localidadesUpdate = checkUpdate(localidadesWeb, localidadesApp);

        // Inserir as localidades na Base de Dados local
        const ListaLocalidadesInserir = [];
        localidadesInserir.forEach(localidade => {
            ListaLocalidadesInserir.push({
                nome: localidade.nome,
                uuid: localidade.uuid,
                hash: localidade.hash
            });
        });

        // UpdateOnDuplicate UUID porque posso, com sync auto off, criar uma localidade
        // que já existe no servidor e assim quando sincronizar a localidade local fica
        // com o uuid da mesma localidade no servidor
        await Localidades.bulkCreate(ListaLocalidadesInserir, {
            updateOnDuplicate: ['uuid']
        });

        // Actualizar as localidades localmente
        const ListaLocalidadesUpdate = [];
        localidadesUpdate.forEach(localidade => {
            const updateStmt = Localidades.update({
                nome: localidade.nome,
                hash: localidade.hash
            }, {
                where: {
                    uuid: localidade.uuid
                }
            });
            ListaLocalidadesUpdate.push(updateStmt);
        });
        // Processa todas as actualizações independentemente de alguma delas rejeitar
        await Promise.allSettled(ListaLocalidadesUpdate);

        // Volta a requerer todas as localidades registadas localmente para verificar quais foram eliminadas na web
        // uma vez que possivelmente foram adicionadas novas localidades
        // Verifica também se podem ser eliminadas, ou seja, não podem ter jogo associados
        const delete_localidadesApp = dbFunctions.getAllLocalidades();
        const delete_listaLocalidadesComEquipas = dbFunctions.getLocalidadesComEquipas();

        const [deleteLocalidadesApp, localidadesComEquipas] = await Promise.all([delete_localidadesApp, delete_listaLocalidadesComEquipas]);
        // Adiciona a cada localidade a flag eliminável
        if(deleteLocalidadesApp.length > 0){
            deleteLocalidadesApp.forEach(localidade => {
                const localidadeIndex = localidadesComEquipas.find(el => el.localidadeId == localidade.localidadeId);
                localidade.eliminavel = (!localidadeIndex) ? true : false;
            });
        }

        const localidadesDelete = checkDelete(localidadesWeb, deleteLocalidadesApp);
        const ListaLocalidadesDelete = [];
        localidadesDelete.forEach(localidade => {
            const deleteStmt = Localidades.destroy({
                where: {
                    uuid: localidade.uuid
                }
            });
            ListaLocalidadesDelete.push(deleteStmt);
        });

        await Promise.allSettled(ListaLocalidadesDelete);

        return true;
    } catch(error) {
        throw error;
    }
}