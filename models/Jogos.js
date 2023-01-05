const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Jogos = sequelize.define('jogos', {
    jogoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    torneioId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    escalaoId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    fase: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    campo: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    equipa1Id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    equipa2Id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    equipa1Pontos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    equipa2Pontos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

module.exports = Jogos;