const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Parciais = sequelize.define('parciais', {
    parcialId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    jogoId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    equipaId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    parcial1: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
    ,
    parcial2: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
    ,
    parcial3: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
    }
}, {
    name: {
        singular: "parcial",
        plural: "parciais"
    }
});

module.exports = Parciais;