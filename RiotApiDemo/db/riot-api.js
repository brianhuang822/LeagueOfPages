var rp = require('request-promise');
var dbConnection = require('./db-connection');
var RiotApi = (function () {
    function RiotApi(apiKey, region) {
        this.timeout = 1250;
        this.db = new dbConnection.DbConnection();
        this.apiKey = apiKey;
        this.region = region;
    }
    RiotApi.prototype.getChallengerMatchIds = function () {
        var self = this;
        self.getSummonerIds('challenger');
        self.waitForApiCooldown();
        self.getSummonerIds('master');
        self.waitForApiCooldown();
        self.getMatchLists();
    };
    RiotApi.prototype.getMatches = function () {
        var self = this;
        self.db.RiotMatchId.find({ isStored: false }).lean().exec(function (err, matchIdObjs) {
            if (!err) {
                for (var i = 0; i < matchIdObjs.length; i++) {
                    var matchId = matchIdObjs[i].matchId;
                    console.log('Getting MatchList for Match: ' + matchId);
                    self.getMatch(matchId);
                    self.waitForApiCooldown();
                }
            }
            else {
                throw err;
            }
        });
    };
    RiotApi.prototype.getSummonerIds = function (league) {
        var self = this;
        rp(self.getSummonerApiUrl(league)).then(function (data) {
            console.log('Saving Summoner IDs');
            data = JSON.parse(data);
            data.entries.forEach(function (player) {
                var summonerIdObj = { summonerId: player.playerOrTeamId };
                self.db.RiotSummonerId.findOneAndUpdate(summonerIdObj, { $set: summonerIdObj }, { upsert: true }).exec();
            });
        });
    };
    RiotApi.prototype.getMatchLists = function () {
        var self = this;
        self.db.RiotSummonerId.find({}).lean().exec(function (err, summonerIdObjs) {
            if (!err) {
                //                summonerIdObjs.length = 1;
                for (var i = 0; i < summonerIdObjs.length; i++) {
                    var summonerId = summonerIdObjs[i].summonerId;
                    console.log('Getting MatchList for Summoner: ' + summonerId);
                    self.getMatchList(summonerId);
                    self.waitForApiCooldown();
                }
            }
            else {
                throw err;
            }
        });
    };
    RiotApi.prototype.getMatchList = function (summonerId) {
        var self = this;
        return rp(this.getMatchListApiUrl(summonerId)).then(function (data) {
            data = JSON.parse(data);
            data.matches.forEach(function (match) {
                var matchIdObj = { summonerId: summonerId, matchId: match.matchId };
                var sameMatchId = { matchId: match.matchId, isStored: false };
                return self.db.RiotMatchId.findOneAndUpdate(sameMatchId, { $set: matchIdObj }, { upsert: true }).exec();
            });
        });
    };
    RiotApi.prototype.getMatch = function (matchId) {
        var self = this;
        return rp(this.getMatchApiUrl(matchId)).then(function (data) {
            data = JSON.parse(data);
            var matchObj = data;
            var sameMatchId = { matchId: matchObj.matchId };
            self.db.RiotMatch.findOneAndUpdate(sameMatchId, { $set: matchObj }, { upsert: true }).exec();
        });
    };
    RiotApi.prototype.getSummonerApiUrl = function (league) {
        return this.riotApiUrl + '/v2.5/league/' + league + '?type=RANKED_SOLO_5x5&seasons=PRESEASON2016&api_key=' + this.apiKey;
    };
    RiotApi.prototype.getMatchListApiUrl = function (summonerId) {
        return this.riotApiUrl + '/v2.2/matchlist/by-summoner/' + summonerId + '?api_key=' + this.apiKey;
    };
    RiotApi.prototype.getMatchApiUrl = function (matchId) {
        return this.riotApiUrl + '/v2.2/match/' + matchId + '?includeTimeline=true&api_key=' + this.apiKey;
    };
    Object.defineProperty(RiotApi.prototype, "riotApiUrl", {
        get: function () {
            return 'https://' + this.region + '.api.pvp.net/api/lol/' + this.region;
        },
        enumerable: true,
        configurable: true
    });
    RiotApi.prototype.waitForApiCooldown = function () {
        var start = new Date().getTime();
        while (new Date().getTime() < start + this.timeout)
            ;
    };
    return RiotApi;
})();
exports.RiotApi = RiotApi;
//# sourceMappingURL=riot-api.js.map