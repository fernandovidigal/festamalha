exports.checkInsert = (web, app) => {
    return web.filter(webItem => {
        const index = app.findIndex(appItem => appItem.uuid == webItem.uuid);
        return index != -1 ? false : true;
    });
}

exports.checkUpdate = (web, app) => {
    return web.filter(webItem => {
        const index = app.findIndex(appItem => appItem.uuid == webItem.uuid && appItem.hash != webItem.hash);
        return index != -1 ? true : false;
    })
}

exports.checkDelete = (web, app) => {
    return app.filter(appItem => {
        const index = web.findIndex(webItem => webItem.uuid == appItem.uuid);
        if(index != -1){
            return false;
        }

        return appItem.eliminavel;
    });
}