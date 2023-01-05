const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Escaloes = sequelize.define('escaloes', {
    escalaoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    designacao: {
        type: Sequelize.STRING,
        allowNull: false
    },
    sexo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            max: 1
        }
    },
    uuid: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
    },
    hash: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: {
            args: true,
            msg: "O Escalão já existe."
        }
    }
}, {
    name: {
        singular: "escalao",
        plural: "escaloes"
    }
});

module.exports = Escaloes;