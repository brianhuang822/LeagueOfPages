﻿
/// <reference path='./typings/tsd.d.ts' />

import express = require('express');
import path = require('path');
import favicon = require('serve-favicon');
import logger = require('morgan');
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');

import routes = require('./routes/index');
import users = require('./routes/users');

import riotApi = require('./db/riot-api');
var apiKey = 'e912989b-9609-40f5-90ad-f8b0b1930342';
var region = 'kr';

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);


var riotApiClient = new riotApi.RiotApi(apiKey, region);
/* Call these in order */
//riotApiClient.getChallengerMatchIds();
//riotApiClient.getMatches();


registerErrorHandlers();

var port: number = process.env.PORT || 3000;
var server = app.listen(port, () => {
    var listeningPort: number = server.address().port;
    console.log('The server is listening on port: ' + listeningPort);
});

export = app;

function registerErrorHandlers(): void {
    // catch 404 and forward to error handler
    app.use((req, res, next) => {
        var err = new Error('Not Found');
        err['status'] = 404;
        next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {

        app.use((err: any, req, res, next) => {
            res.status(err['status'] || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use((err: any, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}