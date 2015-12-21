var q = require('q');
var rp = require('request-promise');
import dbConnection = require('./db-connection');

export class RiotApi {
    
    constructor(apiKey: string, region: string) {
        this.apiKey = apiKey;
        this.region = region;
    }

    getChallengerAndMasterMatchIds(): void {
        var self = this;
        var promises = [self.getSummonerIds('challenger'), self.getSummonerIds('master')];
        q.all(promises).then((result) => {
            console.log('Challenger and Master Summoner Ids:');
            var summonerIds = result[0].concat(result[1]);
            console.log('setting timeout...');
            setTimeout(() => {
                self.getMatchLists(summonerIds);
            }, self.timeout * 2);
        });
    }

    getMatches(): void {
        var self = this;
        self.db.RiotMatchId.find({}).lean().exec((err, matchIdObjs) => {
            console.log('Getting ' + matchIdObjs.length + ' Matches...');
            var interval = setInterval(() => {
                if (matchIdObjs.length > 0) {
                    var matchIdObj = matchIdObjs.splice(0, 1)[0];
                    var matchId = matchIdObj.matchId;
                    self.getMatch(matchId, matchIdObj._id);
                } else {
                    clearInterval(interval);
                }
            }, self.timeout);
        });
    }

    private getSummonerIds(league: string): any {
        var self = this;
        return rp(self.getSummonerApiUrl(league)).then(data => {
            data = JSON.parse(data);
            return data.entries.map(summonerEntry => {
                return summonerEntry.playerOrTeamId;
            });
        });
    }

    private getMatchLists(summonerIds: string[]): void {
        console.log('Getting ' + summonerIds.length + ' MatchLists...');
        var self = this;
        var interval = setInterval(() => {
            if (summonerIds.length > 0) {
                var summonerId = summonerIds.splice(0, 1)[0];
                self.getMatchList(summonerId);
            } else {
                clearInterval(interval);
            }
        }, self.timeout);
    }

    private getMatchList(summonerId: string): void {
        console.log('Requesting MatchList for Summoner: ' + summonerId);
        var self = this;
        rp(this.getMatchListApiUrl(summonerId)).then(data => {
            data = JSON.parse(data);
            data.matches.forEach(match => {
                var matchIdObj = { matchId: match.matchId};
                self.db.RiotMatchId.findOneAndUpdate(matchIdObj, { $set: matchIdObj }, { upsert: true }).exec();
            });
        });
    }

    private getMatch(matchId: string, dbId: string): void {
        console.log('Getting Match: ' + matchId);
        var self = this;
        rp(this.getMatchApiUrl(matchId)).then(data => {
            data = JSON.parse(data);
            var matchObj = data;
            var sameMatchId = { matchId: matchObj.matchId };
            self.db.RiotMatch.findOneAndUpdate(sameMatchId, { $set: matchObj }, { upsert: true }).exec();
            self.db.RiotMatchId.findByIdAndRemove(dbId).exec();
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