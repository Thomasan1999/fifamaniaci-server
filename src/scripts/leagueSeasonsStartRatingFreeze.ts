import * as path                        from 'path';
import * as dotenv                      from 'dotenv';
import * as Pg                          from 'pg';
import {LeagueSeasonValue}              from '../modules/row/LeagueSeason';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {PlayerQueryResult, PlayerValue} from '../modules/row/Player';
import {LeagueSeasons}                  from '../modules/table/LeagueSeasons';
import {LeagueRegistrationsQueryResult} from 'modules/table/LeagueRegistrations';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    const seasonLast: LeagueSeasonValue = await new LeagueSeasons({pg}).findLast({seasonStart: {$lte: new Date()}});

    await Promise.all((await pg.query(
            `SELECT league_registrations.id as id, category_id, canceled, league_registrations.created, completed, rating, season_id, user_id FROM league_registrations
                    INNER JOIN users ON users.id = league_registrations.user_id
                    WHERE canceled IS NOT TRUE AND dnf_after_weeks IS NULL AND season_id = $1 users.verification_code IS NULL`,
        [seasonLast.id]
    ).then((result: LeagueRegistrationsQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    })).map(async ({id, categoryId, userId}) =>
    {
        const {rating}: PlayerValue = await pg.query(
                `SELECT * FROM players WHERE category_id = $1 AND user_id = $2`,
            [categoryId, userId]
        ).then((result: PlayerQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0];
        });

        return await pg.query(
                `UPDATE league_registrations SET rating = COALESCE($1, 0) WHERE id = $2 RETURNING *`,
            [rating, id]
        ).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} SELECT league_registrations.rows.map() UPDATE league_registrations`, err});
            return Promise.reject(err);
        });
    })).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} SELECT league_registrations.rows.map()`, err});
    }).finally(() =>
    {
        process.exit();
    });
})();
