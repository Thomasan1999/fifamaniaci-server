import * as path                        from 'path';
import * as dotenv                      from 'dotenv';
import * as Moment                      from 'moment-timezone';
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

    await pg.query(`SELECT * FROM matches WHERE result_written IS NULL`).then((result: MatchesQueryResult) =>
    {
        const matches: MatchValue[] = Tomwork.queryParse(result).rows;

        const matchesFiltered: MatchValue[] = matches.filter((match) =>
        {
            return match.resultWritten < Moment(`2019-04-30T23:59:59.999+02:00`).toDate();
        }).sort((match, match1) =>
        {
            return match.resultWritten.valueOf() - match1.resultWritten.valueOf();
        });

        console.log(matchesFiltered[0], Moment(matchesFiltered[0].created).format());
        // console.log(
        //     Moment(matchesFiltered[matchesFiltered.length - 1].created).format(),
        //     Moment(matchesFiltered[0].created).format()
        // );
    }).catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} SELECT matches`, err});
    }).finally(async () =>
    {
        process.exit();
    });
})();
