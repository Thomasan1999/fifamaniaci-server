import {ErrorCustom, Tomwork}             from '..';
import {Match, MatchSide}                 from './Match';
import {Row, RowValue}                    from './Row';
import * as Pg                            from 'pg';
import {QueryResultCount}                 from 'types/pg';

export type PlayerValue = Merge<RowValue, {
    categoryId: number;
    rating?: number;
    ratingPrevious?: number;
    userId: number;
}>

export type PlayerValuePublic = {
    id: number,
    rating: number,
    userId: number
}

export type PlayerQueryResult = Merge<Pg.QueryResult, { rows: [PlayerValue] }>;

export class Player extends Row
{
    public initialized: boolean = false;
    public match: Match;
    public ratingNew: number;
    public side: MatchSide;
    public value: PlayerValue;

    constructor({match, pg, side, value}: { match?: Match, pg?: Pg.Client, side?: MatchSide, value: Partial<PlayerValue> })
    {
        super({
            pg,
            value: match ? {...value, categoryId: match.categoryId, userId: match.value[`${side}Id`]} : value,
        });
        this.match = match;
        this.side = side;
    }

    public cacheClear(): void
    {
        this.value.rating = this.ratingNew;
        delete this.ratingNew;
    }

    public async init(): Promise<Partial<PlayerValue>>
    {
        this.initialized = true;
        const player: Partial<PlayerValue> = {...await this.pg.query(
                    `SELECT *, (CASE WHEN rating = 0 THEN 1500 ELSE rating END) AS rating FROM players WHERE category_id = $1 AND user_id = $2`,
                [this.value.categoryId, this.value.userId]
            ).then((result: PlayerQueryResult) =>
            {
                return Tomwork.queryParse(result).rows[0];
            })
        };

        this.value = {...this.value, ...player};
        return player;
    }

    public get matchGoals(): number
    {
        return this.match.value[`${this.side}Goals`];
    }

    public async ratingNewCalc(): Promise<number>
    {
        const {goalDiffFactor, typeFactor} = this.match;

        const playerOther: Player = this.match.players[this.side === `home` ? `away` : `home`];

        const matchIndex: number = await this.pg.query(
                `SELECT COUNT(*)::integer FROM matches
                                INNER JOIN divisions ON divisions.id = matches.division_id
                                WHERE divisions.category_id = $1 AND result_written IS NOT NULL AND result_written < $2 AND $3 IN (away_id, home_id)`,
            [this.match.categoryId, this.match.value.resultWritten, this.value.userId]
        ).then((result: QueryResultCount) =>
        {
            return Tomwork.queryParse(result).rows[0].count;
        });

        const resultFactor: number = (() =>
        {
            const resultSign: number = Math.sign(this.matchGoals - playerOther.matchGoals);
            const overtimeFactor: number = Number(Boolean(this.match.value.overtime));

            return (3 + (resultSign * 3) + (overtimeFactor * -resultSign * 2)) / 6;
        })();

        const matchIndexFactor: number = 1 + (3 * (.9 ** matchIndex));

        const k: number = typeFactor * matchIndexFactor * goalDiffFactor;

        const ratingDiff: number = playerOther.value.rating - this.value.rating;

        const expectedResultFactor: number = 1 / (1 + (10 ** (ratingDiff / 400)));

        return this.value.rating + (k * (resultFactor - expectedResultFactor));
    }

    public async ratingUpdate(): Promise<PlayerQueryResult>
    {
        this.ratingNew = await this.ratingNewCalc();

        if (this.value.id)
        {
            return await this.pg.query(
                    `UPDATE players SET rating = $2, rating_previous = $3
                                    FROM users 
                                    WHERE users.id = players.user_id AND category_id = $1 AND user_id = $4 AND users.verification_code IS NULL RETURNING *`,
                [this.value.categoryId, this.ratingNew, this.value.rating || null, this.value.userId]
            ).then((result: PlayerQueryResult) =>
            {
                return Tomwork.queryParse(result);
            }).catch((err) =>
            {
                new ErrorCustom({at: `Player.ratingUpdate() UPDATE players`, err});
                return Promise.reject(err);
            }) as PlayerQueryResult;
        }

        return await this.pg.query(
            `INSERT INTO players(category_id, rating, rating_previous, user_id) VALUES($1, $2, $3, $4) ON CONFLICT(category_id, user_id) DO NOTHING RETURNING *`,
            [this.value.categoryId, this.ratingNew || 0, this.value.rating || null, this.value.userId]
        ).then((insertedPlayer: PlayerQueryResult) =>
        {
            this.value.id = Tomwork.queryParse(insertedPlayer).rows[0].id;
            return Promise.resolve(insertedPlayer);
        }).catch((err) =>
        {
            new ErrorCustom({at: `Player.ratingUpdate() INSERT INTO players`, err});
            return Promise.reject(err);
        });
    }

    async upsert(): Promise<PlayerQueryResult>
    {
        return await this.pg.query(
            `INSERT INTO players(category_id, user_id) VALUES($1, $2) ON CONFLICT(category_id, user_id) DO NOTHING RETURNING *`,
            [this.value.categoryId, this.value.userId]
        ).then((insertedPlayer: PlayerQueryResult) =>
        {
            const resultParsed: PlayerQueryResult = Tomwork.queryParse(insertedPlayer);

            if (!resultParsed.rowCount)
            {
                return Promise.resolve({...resultParsed, rows: [this.value]} as PlayerQueryResult);
            }

            this.value.id = resultParsed.rows[0].id;
            return Promise.resolve(resultParsed);
        }).catch((err) =>
        {
                new ErrorCustom({at: `Player.upsert() INSERT INTO players`, err});
            return Promise.reject(err);
        });
    }

    public get valuePublic(): PlayerValuePublic
    {
        return (({id, rating, /*ratingPrevious,*/ userId}) =>
        {
            return {
                id,
                // ...(ratingPrevious && {ratingPrevious}),
                rating: rating || 0,
                userId
            };
        })(this.value);
    }
}
