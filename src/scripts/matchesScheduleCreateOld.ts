import {Rand} from '../modules'

type MatchesScheduleTeamValue = number | null
module.exports = ({teamsLength}: {teamsLength: number}) =>
{
    const teams: MatchesScheduleTeamValue[] = Array(Math.ceil(teamsLength / 2) * 2).fill(null).map((value, index) =>
    {
        if (index < teamsLength)
        {
            return index;
        }

        return null;
    });

    const roundLength: number = Math.ceil(teams.length / 2);

    const teamsA: MatchesScheduleTeamValue[] = teams.slice(0, roundLength);
    const teamsB: MatchesScheduleTeamValue[] = teams.slice(roundLength);

    return Array(teams.length - 1).fill(null).map(() =>
    {
        teamsA.splice(1, 0, teamsB.shift());
        teamsB.push(teamsA.pop());

        return Array(roundLength).fill(null).map((value: MatchesScheduleTeamValue, matchIndex: number) =>
        {
            let teamA: MatchesScheduleTeamValue = teamsA[matchIndex];
            let teamB: MatchesScheduleTeamValue = teamsB[matchIndex];

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
    })/*.map((round, index, matchesPairs) =>
     {
     if (index % 2 === 0 && matchesPairs[index + 1])
     {
     return round.map((match) =>
     {
     const nullIndex = match.indexOf(null);

     if (nullIndex !== -1)
     {
     match[nullIndex] = matchesPairs[index + 1].find((matchOther) =>
     {
     return matchOther.includes(null);
     }).find((player) =>
     {
     return player !== null;
     });

     matchesPairs.slice(index).forEach((roundOther, roundOtherIndex) =>
     {
     roundOther.filter((matchOther) =>
     {
     return matchOther.includes(match[0]) && matchOther.includes(match[1]);
     }).forEach((matchOther, matchOtherIndex)=>
     {
     console.log(matchOther);
     delete matchesPairs[roundOtherIndex][matchOtherIndex];
     });
     });

     return match;
     }

     return match;
     });
     }

     return round/!*.filter((match) =>
     {
     return match.every((player) =>
     {
     return player !== null;
     });
     })*!/;
     })*/;
};

