const bcrypt = require('bcryptjs');

module.exports.encrypt = function(word){
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(word, salt);
}

module.exports.sort = function(list){
    list.sort((a, b) => {
        return a.nome.localeCompare(b.nome);
    });
    return list;
}