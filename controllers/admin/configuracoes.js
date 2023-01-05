const configFunctions = require('../../helpers/configFunctions');

exports.getConfig = async (req, res) => {
  try {
    const configData = await configFunctions.readConfigFile();
    if (!configData) throw new Error();

    res.render('admin/configuracoes', { config: configData, breadcrumbs: req.breadcrumbs() });
  } catch (err) {
    console.log(err);
    req.flash('error', 'Não foi possível carregar o ficheiro de configuração!');
    res.redirect('/admin');
  }
};

exports.writeConfigServerPorta = async (req, res) => {
  try {
    const configData = await configFunctions.readConfigFile();
    const inputPort = parseInt(req.body.serverPort);

    if (parseInt(configData.server.port) != inputPort) {
      configData.server.port = inputPort;
      await configFunctions.writeConfigFile(configData);
    }

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
    });
  }
};

exports.switchFaker = async (req, res) => {
  try {
    const configData = await configFunctions.readConfigFile();
    const onOffSwitch = req.body.faker;

    if (configData.faker != onOffSwitch) {
      configData.faker = onOffSwitch;
      await configFunctions.writeConfigFile(configData);
      req.session.faker = onOffSwitch;
    }

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
    });
  }
};

exports.switchSync = async (req, res) => {
  try {
    const configData = await configFunctions.readConfigFile();
    const onOffSyncSwitch = req.body.sync;

    if (configData.sync != onOffSyncSwitch) {
      configData.sync = onOffSyncSwitch;
      await configFunctions.writeConfigFile(configData);
      req.session.sync = onOffSyncSwitch;
    }

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
    });
  }
};

exports.definirEnderecoWeb = async (req, res) => {
  try {
    const configData = await configFunctions.readConfigFile();
    const enderecoWebInputed = req.body.enderecoWeb.trim();

    if (configData.syncUrl != enderecoWebInputed) {
      let enderecoWeb = '';
      if (!enderecoWebInputed.endsWith('/')) {
        enderecoWeb = enderecoWebInputed.concat('/');
      } else {
        enderecoWeb = enderecoWebInputed;
      }

      configData.syncUrl = enderecoWeb;
      await configFunctions.writeConfigFile(configData);
      req.session.syncUrl = enderecoWeb;
    }
    res.status(200).json({
      success: true,
    });
  } catch (err) {
    res.status(200).json({
      success: false,
    });
  }
};
