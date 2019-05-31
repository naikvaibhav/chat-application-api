let appConfig = {};

appConfig.port = 3000;
appConfig.CorsOrigin = '*';
appConfig.env = 'dev';
appConfig.db = {
    uri : 'mongodb://127.0.0.1:27017/chatappdb'
}
appConfig.apiVersion = '/api/v1';

module.exports = {
    port : appConfig.port,
    allowedCorsOrigin : appConfig.CorsOrigin,
    environment : appConfig.env,
    db : appConfig.db,
    apiVersion : appConfig.apiVersion
}

