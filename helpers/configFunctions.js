const fs = require('fs');
const appPaths = require('./appPaths');
const secure = require('./secure');

exports.readConfigFile = async function(){
    return new Promise((resolve, reject) => {
        fs.readFile(appPaths.configFileName, 'utf8', (err, data) => {
          if (err) return reject(err);
          decryptedData = secure.decrypt(JSON.parse(data));
          return resolve(JSON.parse(decryptedData));
        });
    });
}

exports.writeConfigFile = async function(data){
    return new Promise((resolve, reject) => {
        const cryptedConfigData = secure.encrypt(JSON.stringify(data));
        fs.writeFile(appPaths.configFileName, JSON.stringify(cryptedConfigData), (err) => {
            if(err) return reject(err);
            return resolve();
        });
    });
}