const Sequelize = require('sequelize');
const appPaths = require('./appPaths');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: appPaths.dbPath,
    logging: false,
    define: {
        timestamps: false
    }
});

module.exports = sequelize;