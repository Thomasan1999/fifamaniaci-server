import * as path                                  from 'path';
import * as dotenv                                from 'dotenv';
import * as Pg                                    from 'pg';
import {CategoryValue}                            from '../modules/row/Category';
import {MatchesTypeQueryResult, MatchesTypeValue} from '../modules/row/MatchesType';
import {Division, DivisionValue}                  from '../modules/row/Division';
import {ErrorCustom, PgClient, Tomwork}           from '../modules';
import {MatchesPlayOff}                           from '../modules/table/MatchesPlayOff';
import {LeagueSeasons}                            from '../modules/table/LeagueSeasons';
import {CategoriesQueryResult}                    from 'modules/table/Categories';
import {DivisionsQueryResult}                     from 'modules/table/Divisions';
import {QueryResultCount}                         from 'types/pg';

(async () =>
{
    dotenv.config({path: `${__dirname}/../.env`});

    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const pg: Pg.Client = await PgClient.connect();

    const categoriesArray: CategoryValue[] = await pg.query(`SELECT * FROM categories`).then((result: CategoriesQueryResult) =>
    {
        return Tomwork.queryParse(result).rows;
    });

    const matchTypeLeague: MatchesTypeValue = await pg.query(
            `SELECT * FROM matches_types WHERE name = 'league'`
    ).then((result: MatchesTypeQueryResult) =>
    {
        return Tomwork.queryParse(result).rows[0];
    });

    const matchTypePlayOff: MatchesTypeValue = await pg.query(
            `SELECT * FROM matches_types WHERE name = 'playOff'`
    ).then((result: MatchesTypeQueryResult) =>
    {
        return Tomwork.queryParse(result).rows[0];
    });

    const seasonId: number = (await new LeagueSeasons({pg}).findLast({seasonStart: {$lte: new Date()}})).id;

    await Promise.all(categoriesArray.map(async (category: CategoryValue) =>
    {
        const divisionsArray = await pg.query(
                `SELECT * FROM divisions WHERE category_id = $1 AND match_type_id = $2`,
            [category.id, matchTypeLeague.id]
        ).then((result: DivisionsQueryResult) =>
        {
            return Tomwork.queryParse(result).rows;
        });

        const categoryId: number = category.id;

        return await Promise.all(divisionsArray.map(async (divisionLeague: DivisionValue) =>
        {
            if (!await pg.query(
                    `SELECT COUNT(*)::integer FROM matches WHERE division_id = $1 AND result_written IS NOT NULL`,
                [divisionsArray[0].id]
            ).then((result: QueryResultCount) =>
            {
                return Tomwork.queryParse(result).rows[0].count;
            }))
            {
                return;
            }

            const divisionPlayOff = new Division({
                io: {
                    //@ts-ignore
                    emitCustom()
                    {
                    }
                },
                pg,
                value: {categoryId, index: divisionLeague.index, level: divisionLeague.level, matchTypeId: matchTypePlayOff.id}
            });

            await divisionPlayOff.upsert();

            const matchesPlayOff: MatchesPlayOff = new MatchesPlayOff({divisionLeague, divisionPlayOff: divisionPlayOff.value, pg, seasonId});

            await matchesPlayOff.roundPush();
        }));
    }));
    process.exit();
})();
