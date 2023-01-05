const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Campos = sequelize.define('campos', {
    torneioId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    escalaoId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    numCampos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

module.exports = Campos;