const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Interdicoes = sequelize.define('interdicoes', {
    interdicaoId: {
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
    campo: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = Interdicoes;