import q = require('q');
import rp = require('request-promise');
import dbConnection = require('./db-connection');

export class RiotApi {
    
    constructor(apiKey: string, region: string) {
        this.apiKey = apiKey;
        this.region = region;
    }

    getChallengerMatchIds(): void {
        var self = this;
        self.getSummonerIds('challenger');
        self.waitForApiCooldown();
        self.getSummonerIds('master');
        self.waitForApiCooldown();
        self.getMatchLists();
    }

    getMatches(): void {
        var self = this;
        self.db.RiotMatchId.find({ isStored: false }).lean().exec((err, matchIdObjs) => {
            if (!err) {
                for (var i = 0; i < matchIdObjs.length; i++) {
                    var matchId = matchIdObjs[i].matchId;
                    console.log('Getting MatchList for Match: ' + matchId);
                    self.getMatch(matchId);
                    self.waitForApiCooldown();
                }
            } else {
                throw err;
            }
        });
    }

    private getSummonerIds(league: string): void {
        var self = this;
        rp(self.getSummonerApiUrl(league)).then(data => {
            console.log('Saving Summoner IDs');
            data = JSON.parse(data);
            data.entries.forEach(player => {
                var summonerIdObj = { summonerId: player.playerOrTeamId };
                self.db.RiotSummonerId.findOneAndUpdate(summonerIdObj, { $set: summonerIdObj }, { upsert: true }).exec();
            });
        });
    }

    private getMatchLists(): void {
        var self = this;
        self.db.RiotSummonerId.find({}).lean().exec((err, summonerIdObjs) => {
            if (!err) {
//                summonerIdObjs.length = 1;
                for (var i = 0; i < summonerIdObjs.length; i++) {
                    var summonerId = summonerIdObjs[i].summonerId;
                    console.log('Getting MatchList for Summoner: ' + summonerId);
                    self.getMatchList(summonerId);
                    self.waitForApiCooldown();
                }
            } else {
                throw err;
            }
        });
    }

    private getMatchList(summonerId: string): q.IPromise<void> {
        var self = this;
        return rp(this.getMatchListApiUrl(summonerId)).then(data => {
            data = JSON.parse(data);
            data.matches.forEach(match => {
                var matchIdObj = { summonerId: summonerId, matchId: match.matchId};
                var sameMatchId = { matchId: match.matchId, isStored: false };
                return self.db.RiotMatchId.findOneAndUpdate(sameMatchId, { $set: matchIdObj }, { upsert: true }).exec();
            });
        });
    }

    private getMatch(matchId: string): Promise<void> {
        var self = this;
        return rp(this.getMatchApiUrl(matchId)).then(data => {
            data = JSON.parse(data);
            var matchObj = data;
            var sameMatchId = { matchId: matchObj.matchId };
            self.db.RiotMatch.findOneAndUpdate(sameMatchId, { $set: matchObj }, { upsert: true }).exec();
        });
    }

    private getSummonerApiUrl(league: string): string {
        return this.riotApiUrl + '/v2.5/league/' + league + '?type=RANKED_SOLO_5x5&seasons=PRESEASON2016&api_key=' + this.apiKey;
    }

    private getMatchListApiUrl(summonerId: string): string {
        return this.riotApiUrl + '/v2.2/matchlist/by-summoner/' + summonerId + '?api_key=' + this.apiKey;
    }

    private getMatchApiUrl(matchId: string) : string {
        return this.riotApiUrl + '/v2.2/match/' + matchId + '?includeTimeline=true&api_key=' + this.apiKey;
    }

    private get riotApiUrl(): string {
        return 'https://' + this.region + '.api.pvp.net/api/lol/' + this.region;
    }

    private waitForApiCooldown(): void {
        var start = new Date().getTime();
        while (new Date().getTime() < start + this.timeout);
    }

    private timeout: number = 1250;
    private apiKey: string;
    private region: string;
    private db = new dbConnection.DbConnection();
}