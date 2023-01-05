const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const breadcrumbs = require('express-breadcrumbs');

const util = require('./helpers/util');
const fileStruct = require('./helpers/fileStruct');
const configFile = require('./helpers/configFunctions');

let serverConfig = {
  server: {
    port: 3000,
  },
  faker: false,
  sync: false,
  syncUrl: null,
};

// Chech File Structure
fileStruct.dataDirectoryCheck();

configFile
  .readConfigFile()
  .then((data) => {
    serverConfig = data;
    console.log('Configuração do servidor carregada!');
  })
  .catch((err) => {
    configFile.writeConfigFile(serverConfig).then(() => {
      console.log('Carregada configuração por defeito do servidor!');
    });
  });

// Database
const sequelize = require('./helpers/database');

// Models
const Users = require('./models/user');
const Localidades = require('./models/Localidades');
const Escaloes = require('./models/Escaloes');
const Torneios = require('./models/Torneios');
const Equipas = require('./models/Equipas');
const Jogos = require('./models/Jogos');
const Parciais = require('./models/Parciais');
const Campos = require('./models/Campos');
const Interdicoes = require('./models/Interdicoes');

// Definir relações entre as bases de dados
Torneios.hasMany(Equipas, { foreignKey: 'torneioId', onDelete: 'cascade' });
Equipas.belongsTo(Torneios, { foreignKey: 'torneioId' });
Localidades.hasMany(Equipas, { foreignKey: 'localidadeId', onDelete: 'cascade' });
Equipas.belongsTo(Localidades, { foreignKey: 'localidadeId' });
Escaloes.hasMany(Equipas, { foreignKey: 'escalaoId', onDelete: 'cascade' });
Equipas.belongsTo(Escaloes, { foreignKey: 'escalaoId' });
Torneios.hasMany(Campos, { foreignKey: 'torneioId', onDelete: 'cascade' });
Campos.belongsTo(Torneios, { foreignKey: 'torneioId' });
Escaloes.hasMany(Campos, { foreignKey: 'escalaoId', onDelete: 'cascade' });
Campos.belongsTo(Escaloes, { foreignKey: 'escalaoId' });

Torneios.hasMany(Jogos, { foreignKey: 'torneioId', onDelete: 'cascade' });
Jogos.belongsTo(Torneios, { foreignKey: 'torneioId' });
Escaloes.hasMany(Jogos, { foreignKey: 'escalaoId', onDelete: 'cascade' });
Jogos.belongsTo(Escaloes, { foreignKey: 'escalaoId' });
Equipas.hasMany(Jogos, { foreignKey: 'equipa1Id', onDelete: 'set null' });
Jogos.belongsTo(Equipas, { foreignKey: 'equipa1Id' });
Equipas.hasMany(Jogos, { foreignKey: 'equipa2Id', onDelete: 'set null' });
Jogos.belongsTo(Equipas, { foreignKey: 'equipa2Id' });

Jogos.hasMany(Parciais, { foreignKey: 'jogoId', onDelete: 'cascade' });
Parciais.belongsTo(Jogos, { foreignKey: 'jogoId' });
Equipas.hasMany(Parciais, { foreignKey: 'equipaId', onDelete: 'cascade' });
Parciais.belongsTo(Equipas, { foreignKey: 'equipaId' });

Torneios.hasMany(Interdicoes, { foreignKey: 'torneioId', onDelete: 'cascade' });
Interdicoes.belongsTo(Torneios, { foreignKey: 'torneioId' });

// Template View Engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Assets
app.use(express.static(path.join(__dirname, 'assets')));

// Body Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SESSIONS
app.use(
  session({
    secret: 'malhanodejs',
    resave: false,
    saveUninitialized: false,
  })
);

// BREADCRUMBS
app.use(breadcrumbs.init());

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// Flash Messages
app.use(flash());

// METHOD OVERRIDE
app.use(methodOverride('_method'));

app.use(function (req, res, next) {
  res.locals.loggedUser = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  res.locals.warning = req.flash('warning');
  res.locals.activeConnection = req.session.activeConnection || false;
  res.locals.syncActive = req.session.sync || false;
  res.locals.faker = req.session.faker || false;
  next();
});

// Routes
const login = require('./routes/login');
const index = require('./routes/index');
const adminUtilizadores = require('./routes/admin/utilizadores');
const adminLocalidades = require('./routes/admin/localidades');
const adminEscaloes = require('./routes/admin/escaloes');
const adminTorneios = require('./routes/admin/torneios');
const adminConfiguracoes = require('./routes/admin/configuracoes');
const adminSincronizacao = require('./routes/admin/sincronizacao');
const equipas = require('./routes/equipas');
const torneio = require('./routes/torneio');
const listagens = require('./routes/listagens');

// Define o inicio dos Breadcrumbs
app.use(
  '/',
  breadcrumbs.setHome({
    name: 'Início',
    url: '/',
  })
);

app.use('/login', login);
app.use(
  '/',
  (req, res, next) => {
    req.session.sync = serverConfig.sync;
    req.session.syncUrl = serverConfig.syncUrl;
    req.session.faker = serverConfig.faker;
    next();
  },
  index
);
app.use('/admin/utilizadores', adminUtilizadores);
app.use('/admin/localidades', adminLocalidades);
app.use('/admin/escaloes', adminEscaloes);
app.use('/admin/torneios', adminTorneios);
app.use('/admin/configuracoes', adminConfiguracoes);
app.use('/admin/sincronizacao', adminSincronizacao);
app.use('/equipas', equipas);
app.use('/torneio', torneio);
app.use('/listagens', listagens);

app.all('*', (req, res) => {
  res.render('404');
});

sequelize
  .sync()
  .then(async (result) => {
    const [user, created] = await Users.findOrCreate({
      where: { username: 'festamalha' },
      defaults: {
        password: util.encrypt('malhacimac'),
        level: 10,
      },
    });

    if (!user) {
      console.log('Não foi possível criar ou aceder ao utilizador por defeito. Contacte o administrador da aplicação.');
      process.exit();
    }

    const port = serverConfig.server.port;
    app.listen(port, () => {
      console.log(`\nMalha App em localhost:${port} ou <IP da máquina>:${port}`);
      console.log(`\n\nCTRL+C para terminar`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
