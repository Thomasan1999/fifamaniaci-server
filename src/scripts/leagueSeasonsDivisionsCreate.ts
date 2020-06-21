import * as path                        from 'path';
import * as dotenv                      from 'dotenv';
import * as Pg                          from 'pg';
import {DivisionValue}                  from '../modules/row/Division';
import {ErrorCustom, PgClient, Tomwork} from '../modules';
import {LeagueSeasons}                  from '../modules/table/LeagueSeasons';
import {DivisionsQueryResult}           from 'modules/table/Divisions';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();
    const divisions: DivisionValue[] = await pg.query(
            `SELECT * FROM divisions WHERE level IS NOT NULL`
    ).then((result: DivisionsQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    });

    await divisions.reduce((a: Promise<any>, division) =>
    {
        return a.then(async () =>
        {
            const seasonId: number = (await new LeagueSeasons({pg}).findLast()).id;

            return await pg.query(
                    `INSERT INTO league_seasons_divisions(division_id, season_id) VALUES($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
                [division.id, seasonId]
            );
        });
    }, Promise.resolve()).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} Promise.all()`, err});
    }).finally(async () =>
    {
        process.exit();
    });
})();
