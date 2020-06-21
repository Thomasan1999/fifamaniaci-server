import * as Pg                                                    from 'pg';
import * as pgFormat                                              from 'pg-format';
import {Table}                                                    from './/index';
import {LeagueRegistrationValue}                                  from '../row/LeagueRegistration';
import {LeagueFinalPositionQueryResult, LeagueFinalPositionValue} from '../row/LeagueFinalPosition';
import {LeagueSeasons}                                            from './LeagueSeasons';
import {Tomwork}                                                  from '..';

export type LeagueRegistrationsQueryResult = Merge<Pg.QueryResult, { rows: LeagueRegistrationValue[] }>;

export class LeagueRegistrations extends Table
{
    constructor({pg}: { pg: Pg.Client })
    {
        super({pg});
    }

    public async finalPositionGet({categoryId, seasonId, userId}: LeagueRegistrationValue): Promise<number | null>
    {
        const leagueFinalPosition: LeagueFinalPositionValue | null = await this.pg.query(
                `SELECT * FROM league_final_positions WHERE category_id = $1 AND season_id = $2 AND user_id = $3`,
            [categoryId, seasonId, userId]
        ).then((result: LeagueFinalPositionQueryResult) =>
        {
            return Tomwork.queryParse(result).rows[0];
        });

        if (leagueFinalPosition === null)
        {
            return;
        }

        return leagueFinalPosition.position;
    }

    public static async finalPositionLookup({pg, query}: { pg: Pg.Client, query: { seasonId: number } }): Promise<string>
    {
        const seasonPreviousId: number = (await new LeagueSeasons({pg}).findLast({
            id: {$lt: query.seasonId}
        }) || {id: null}).id;

        if (!seasonPreviousId)
        {
            return ``;
        }

        return pgFormat(
            `INNER JOIN league_final_positions final_position ON category_id = league_registrations.category_id AND season_id = %s AND user_id = league_registrations.user_id`,
            seasonPreviousId
        );
    }
}
