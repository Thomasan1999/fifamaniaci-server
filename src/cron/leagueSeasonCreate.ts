import {ErrorCustom, PgClient}                          from '../modules';
import * as Moment                                      from 'moment-timezone';
import * as Pg                                          from 'pg';
import {/*LeagueSeasonQueryResult,*/ LeagueSeasonValue} from '../modules/row/LeagueSeason';
import {LeagueSeasons}                                  from '../modules/table/LeagueSeasons';

(async () =>
{
    const pg: Pg.Client = await PgClient.connect();

    const leagueSeasonPrevious: LeagueSeasonValue = await new LeagueSeasons({pg}).findLast();

    const leagueSeasonDuration: [number, Moment.DurationInputArg2] = [1, `m`];

    const toDateIncremented = (moment: Moment.Moment): Date =>
    {
        return moment.add(...leagueSeasonDuration).toDate();
    };

    const leagueSeasonNext: Pick<LeagueSeasonValue, 'divisionSize' | 'seasonEnd' | 'playOffEnd' | 'playOffRoundsLimit' | 'playOffStart' | 'playOffWinsLimit' | 'registrationTo' | 'seasonStart'> = {
        divisionSize: 10,
        playOffEnd: toDateIncremented(Moment(leagueSeasonPrevious.playOffEnd)),
        playOffRoundsLimit: 2,
        playOffStart: toDateIncremented(Moment(leagueSeasonPrevious.playOffStart)),
        playOffWinsLimit: 2,
        registrationTo: toDateIncremented(Moment(leagueSeasonPrevious.registrationTo)),
        seasonEnd: toDateIncremented(Moment(leagueSeasonPrevious.seasonEnd)),
        seasonStart: toDateIncremented(Moment(leagueSeasonPrevious.seasonStart))
    };

    return await pg.query(
            `INSERT INTO league_seasons(division_size, play_off_end, play_off_rounds_limit, play_off_start, play_off_wins_limit, registration_to, season_end, season_start)
                          VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
            leagueSeasonNext.divisionSize, leagueSeasonNext.playOffEnd, leagueSeasonNext.playOffRoundsLimit,
            leagueSeasonNext.playOffStart, leagueSeasonNext.playOffWinsLimit, leagueSeasonNext.registrationTo,
            leagueSeasonNext.seasonEnd, leagueSeasonNext.seasonStart]
    ).then((/*result: LeagueSeasonQueryResult*/) =>
    {
    }).catch((err) =>
    {
        new ErrorCustom({at: `cron/leagueSeasonCreate INSERT INTO league_seasons`, err});
        return Promise.reject(err);
    }).finally(() =>
    {
        process.exit();
    });
})();
