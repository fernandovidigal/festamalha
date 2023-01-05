const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Equipas = sequelize.define('equipas', {
    equipaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    torneioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    primeiroElemento: {
        type: Sequelize.STRING,
        allowNull: false
    },
    segundoElemento: {
        type: Sequelize.STRING,
        allowNull: false
    },
    localidadeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    escalaoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    local: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    uuid: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
    },
    hash: {
        type: Sequelize.STRING(128),
        allowNull: false,
    }
},
{
    indexes: [
        { unique: true, fields: ['torneioId', 'hash'] },
        { unique: true, fields: ['torneioId', 'equipaId', 'escalaoId'] }
    ]
});

module.exports = Equipas;