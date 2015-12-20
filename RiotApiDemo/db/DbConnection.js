/// <reference path="../typings/tsd.d.ts" />
var mongoose = require('mongoose');
var noSchema = new mongoose.Schema({}, { strict: false });
var DbConnection = (function () {
    function DbConnection(connectionString) {
        this.RiotSummonerId = mongoose.model('RiotSummonerIds', noSchema);
        this.RiotMatchId = mongoose.model('RiotMatchIds', noSchema);
        this.RiotMatch = mongoose.model('RiotMatches', noSchema);
        mongoose.connect(connectionString);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function (callback) { console.log('Database connection successful!'); });
    }
    return DbConnection;
})();
exports.DbConnection = DbConnection;
//# sourceMappingURL=DbConnection.js.map