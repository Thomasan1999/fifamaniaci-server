"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modules_1 = require("../modules");
module.exports = ({ divisionSize, teamsLength }) => {
    const teams = Array(Math.ceil(teamsLength / 2) * 2).fill(null).map((value, index) => {
        if (index < teamsLength) {
            return index;
        }
        return null;
    });
    const repeatCount = Math.floor((divisionSize - 1) / (teamsLength - 1));
    const roundLength = Math.ceil(teams.length / 2);
    const teamsA = teams.slice(0, roundLength);
    const teamsB = teams.slice(roundLength);
    const matchesScheduleInstance = Array(teams.length - 1).fill(null).map(() => {
        teamsA.splice(1, 0, teamsB.shift());
        teamsB.push(teamsA.pop());
        return Array(roundLength).fill(null).map((value, matchIndex) => {
            const teamA = teamsA[matchIndex];
            const teamB = teamsB[matchIndex];
            if (modules_1.Rand.int({ max: 1 }) === 0) {
                return [teamA, teamB];
            }
            return [teamB, teamA];
        }).filter((match) => {
            return match.every((player) => {
                return player !== null;
            });
        });
    });
    return Array(repeatCount).fill(matchesScheduleInstance).flat();
};
//# sourceMappingURL=matchesScheduleCreate.js.map