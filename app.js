const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const appConfig = require('./config/appConfig');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const http = require('http');
const logger = require('./app/libs/loggerLib');


const globalErrorMiddleware = require('./app/middleware/appErrorHandler');
const routeLoggerMiddleware = require('./app/middleware/routeLogger');
const morgan = require('morgan')


app.use(morgan('dev'));

//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:false}));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use(routeLoggerMiddleware.logIp);
app.use(globalErrorMiddleware.globalErrorHandler);



//dirname stands for current directory and client is the folder
app.use(express.static(path.join(__dirname, 'client')));

const modelsPath = './app/models';
const controllerPath = './app/controllers';
const libPath = './app/libs';
const middlewarePath = './app/middleware';
const routesPath = './app/routes';

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    next();
});

//bootstrap models

fs.readdirSync(modelsPath).forEach(function(file){
  if(~file.indexOf('.js')) 
  console.log(file)
  require(modelsPath+'/'+file)
})//end bootstrap models


//bootstrap route
fs.readdirSync(routesPath).forEach(function(file){
  //checking js extension for the files in router folder
  if(~file.indexOf('.js')){
      console.log('the files present in the routes folder:\n');
      console.log(routesPath+'/'+file);
      let route = require(routesPath+'/'+file);
      route.setRouter(app);
    }
});
//end bootstrap route

//calling global 404 handler after route
app.use(globalErrorMiddleware.globalNotFoundHandler);
//end global 404 handler



// create http server

const server = http.createServer(app);
//start listening to http server
console.log(appConfig);
server.listen(appConfig.port);
server.on('error', onError);
server.on('listening', onListening);
//end server listening code

//socket io connection handler
const socketLib = require('./app/libs/socketLib');
const socketServer = socketLib.setServer(server);

//event listener for http server "error" event

function onError(error){
    if(error.syscall !== 'listen'){
        logger.error(error.code + 'not equal listen', 'serverOnErrorHandler',10)
        throw error;
    }

    //handle specific listen errors with friendly messages
    switch(error.code){
        case 'EACCES':
            logger.error(error.code+ ':elevated privilages required','serverOnErrorHandler',10);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(error.code + ':port is already in use.', 'serverOnErrorHandler',10);
            process.exit(1);
            break;
        default:
            logger.error(error.code + ':some unknown error occured', 'serverOnErrorHandler',10);
            throw error;
    }
}

//Event listener for HTTP server "listening" event.

function onListening(){
    var addr = server.address();
    var bind = typeof addr == 'string'
    ? 'pipe' + addr
    : 'port' + addr.port;
    ('Listening on' + bind);
    logger.info('server listening on port'+addr.port,'serverOnListeningHandler',10);
    let db = mongoose.connect(appConfig.db.uri,{ useMongoClient : true});

}


process.on('unhandledRejection',(reason,p)=>{
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

/**
 * database connection settings
 */
mongoose.connection.on('error', function (err) {
    console.log('database connection error');
    console.log(err)
    logger.error(err,'mongoose connection on error handler', 10)
    //process.exit(1)
  }); // end mongoose connection error
  
  mongoose.connection.on('open', function (err) {
    if (err) {
      console.log("database error");
      console.log(err);
      logger.error(err, 'mongoose connection open handler', 10)
    } else {
      console.log("database connection open success");
      logger.info("database connection open",
        'database connection open handler', 10)
    }
    //process.exit(1)
  }); // enr mongoose connection open handle


  // end socketio connection handler



module.exports = app;