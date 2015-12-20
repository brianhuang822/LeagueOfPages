﻿/// <reference path="../typings/tsd.d.ts" />

import mongoose = require('mongoose');

var connectionString = 'mongodb://localhost:27017/riot-api-demo';
var noSchema: mongoose.Schema = new mongoose.Schema({}, { strict: false });


export class DbConnection {
    
    RiotSummonerId: mongoose.Model<any> = mongoose.model<any>('RiotSummonerIds', noSchema);
    RiotMatchId: mongoose.Model<any> = mongoose.model<any>('RiotMatchIds', noSchema);
    RiotMatch: mongoose.Model<any> = mongoose.model<any>('RiotMatches', noSchema);
    
    constructor() {
        mongoose.connect(connectionString);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', callback => { console.log('Database connection successful!')});
    }
}