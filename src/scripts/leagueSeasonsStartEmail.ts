import * as path                        from 'path';
import * as dotenv                      from 'dotenv';
import * as Pg                          from 'pg';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {UserQueryResult}                from '../modules/row/User';
import {LeagueRegistrationValue}        from '../modules/row/LeagueRegistration';
import {LeagueSeasonValue}              from '../modules/row/LeagueSeason';
import {LeagueSeasons}                  from '../modules/table/LeagueSeasons';
import {QueryResultId}                  from 'types/pg';
import {LeagueRegistrationsQueryResult} from 'modules/table/LeagueRegistrations';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    const seasonLast: LeagueSeasonValue = await new LeagueSeasons({pg}).findLast({seasonStart: {$lte: new Date()}});

    const categoryPs4FutId: number = (await pg.query(`SELECT id FROM categories WHERE name = 'ps4Fut'`).then((result: QueryResultId) =>
    {
        return Tomwork.queryParse(result).rows[0];
    })).id;

    const leagueRegistrations: LeagueRegistrationValue[] = await pg.query(
            `SELECT * FROM league_registrations 
                        INNER JOIN users ON users.id = league_registrations.user_id
                        WHERE category_id != $1 AND canceled IS NOT TRUE AND season_id = $2 AND users.verification_code IS NULL`,
        [categoryPs4FutId, seasonLast.id]
    ).then((result: LeagueRegistrationsQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    }).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} SELECT league_registrations`, err});
        return Promise.reject(err);
    });

    const leagueSeasonsStartEmail = require(`../routes/mail/leagueSeasonsStart`);

    await Promise.all(leagueRegistrations.map(async ({categoryId, userId}) =>
    {
        const {email, username, variableSymbol} = await pg.query(`SELECT * FROM users WHERE id = $1`, [userId]).then((result: UserQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0];
        });

        return leagueSeasonsStartEmail({categoryId, email, pg, username, variableSymbol: variableSymbol.toString().padStart(10, `0`)}).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} leagueRegistrations.toArray().map() leagueSeasonsStartEmail`, err});
        });
    })).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} leagueRegistrations.toArray().map()`, err});
    }).finally(() =>
    {
        process.exit();
    });
})();
