"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modules_1 = require("../modules");
module.exports = ({ teamsLength }) => {
    const teams = Array(Math.ceil(teamsLength / 2) * 2).fill(null).map((value, index) => {
        if (index < teamsLength) {
            return index;
        }
        return null;
    });
    const roundLength = Math.ceil(teams.length / 2);
    const teamsA = teams.slice(0, roundLength);
    const teamsB = teams.slice(roundLength);
    return Array(teams.length - 1).fill(null).map(() => {
        teamsA.splice(1, 0, teamsB.shift());
        teamsB.push(teamsA.pop());
        return Array(roundLength).fill(null).map((value, matchIndex) => {
            let teamA = teamsA[matchIndex];
            let teamB = teamsB[matchIndex];
            if (modules_1.Rand.int({ max: 1 }) === 0) {
                return [teamA, teamB];
            }
            return [teamB, teamA];
        }).filter((match) => {
            return match.every((player) => {
                return player !== null;
            });
        });
    }) /*.map((round, index, matchesPairs) =>
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
//# sourceMappingURL=matchesScheduleCreateOld.js.map