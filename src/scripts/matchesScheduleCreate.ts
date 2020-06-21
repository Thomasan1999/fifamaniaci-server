import {Rand}              from '../modules'

type MatchesScheduleTeamValue = number | null
module.exports = ({divisionSize, teamsLength}: {divisionSize: number, teamsLength: number}) =>
{
    const teams: MatchesScheduleTeamValue[] = Array(Math.ceil(teamsLength / 2) * 2).fill(null).map((value, index) =>
    {
        if (index < teamsLength)
        {
            return index;
        }

        return null;
    });

    const repeatCount: number = Math.floor((divisionSize - 1) / (teamsLength - 1));
    const roundLength: number = Math.ceil(teams.length / 2);

    const teamsA: MatchesScheduleTeamValue[] = teams.slice(0, roundLength);
    const teamsB: MatchesScheduleTeamValue[] = teams.slice(roundLength);

    const matchesScheduleInstance: MatchesScheduleTeamValue[][][] = Array(teams.length - 1).fill(null).map(() =>
    {
        teamsA.splice(1, 0, teamsB.shift());
        teamsB.push(teamsA.pop());

        return Array(roundLength).fill(null).map((value: MatchesScheduleTeamValue, matchIndex: number) =>
        {
            const teamA: MatchesScheduleTeamValue = teamsA[matchIndex];
            const teamB: MatchesScheduleTeamValue = teamsB[matchIndex];

            if (Rand.int({max: 1}) === 0)
            {
                return [teamA, teamB];
            }

            return [teamB, teamA];
        }).filter((match: MatchesScheduleTeamValue[]) =>
        {
            return match.every((player) =>
            {
                return player !== null;
            });
        });
    });

    return Array(repeatCount).fill(matchesScheduleInstance).flat();
};

