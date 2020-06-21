import * as path                        from 'path';
import * as dotenv                      from 'dotenv';
import * as Pg                          from 'pg';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {MatchValue}                     from '../modules/row/Match';
import {MatchesQueryResult}             from '../modules/table/Matches';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    const leagueMatches: MatchValue[] = await pg.query(
            `SELECT * FROM matches WHERE season_id = 2 AND week IS NOT NULL`
    ).then((result: MatchesQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    }).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} SELECT matches`, err});
        return Promise.reject(err);
    });

    const leagueMatchesOpponents: string[] = leagueMatches.map((leagueMatch) =>
    {
        return `${leagueMatch.divisionId.toString()}${leagueMatch.homeId.toString()}${leagueMatch.awayId.toString()}`;
    });

    const leagueMatchesOpponentsCounter: { [s: string]: number } = {};

    leagueMatchesOpponents.forEach((leagueMatchOpponents) =>
    {
        leagueMatchesOpponentsCounter[leagueMatchOpponents] = (leagueMatchesOpponentsCounter[leagueMatchOpponents] || 0) + 1;
    });

    console.log(leagueMatchesOpponents.length - new Set(leagueMatchesOpponents).size);
    process.exit();
})();
