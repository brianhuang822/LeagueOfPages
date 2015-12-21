/// <reference path="../typings/tsd.d.ts" />

import mongoose = require('mongoose');

var connectionString = 'mongodb://localhost:27017/riot-api-demo';
var matchIdSchema: mongoose.Schema = new mongoose.Schema({ matchId: { type: String, unique: true } });
var matchSchema: mongoose.Schema = new mongoose.Schema({ matchId: { type: String, unique: true } }, { strict: false });

export class DbConnection {
    RiotMatchId: mongoose.Model<any> = mongoose.model<any>('RiotMatchIds', matchIdSchema);
    RiotMatch: mongoose.Model<any> = mongoose.model<any>('RiotMatches', matchSchema);
    
    constructor() {
        mongoose.connect(connectionString);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', callback => { console.log('Database connection successful!')});
    }
}