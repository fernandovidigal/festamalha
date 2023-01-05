const path = require("path");

// PASTA DATA
exports.dataDirName = "data";
//exports.dataDirName = path.join(path.dirname(process.execPath), '/data');

// BASE DE DADOS
exports.dbPath = "data/malha.db";
//exports.dbPath = path.join(path.dirname(process.execPath), '/data/malha.db');

// FICHEIRO DE CONFIGURAÇÃO
exports.configFileName = "config.json";
//exports.configFileName = path.join(path.dirname(process.execPath), '/config.json');

// FICHEIRO DO SQLITE
exports.sqliteNode = path.join(path.dirname(process.execPath), '/node_sqlite3.node');
