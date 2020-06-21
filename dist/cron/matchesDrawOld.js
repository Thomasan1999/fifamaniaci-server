"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modules_1 = require("../modules");
const fs_extra_1 = require("fs-extra");
const path = require("path");
(async () => {
    const proposalsDirPath = path.resolve(__dirname, `..`, `proposals`);
    const proposalsDir = await fs_extra_1.promises.readdir(proposalsDirPath);
    proposalsDir.forEach((filename) => {
        require(path.resolve(proposalsDirPath, filename));
    });
    function isOkay({ drawnMatch, drawnMatches = [] }) {
        return drawnMatches.every((match) => {
            return !match.includes(drawnMatch[0]) && !match.includes(drawnMatch[1]);
        });
    }
    function draw(drawnMatches, remainingMatches) {
        const drawnMatchesNew = arrayCopy(drawnMatches);
        const remainingMatchesNew = arrayCopy(remainingMatches);
        if (remainingMatchesNew.length > 6) {
            if (Math.floor(leagueSize / 2) === drawnMatchesNew[drawnMatches.length - 1].length) {
                drawnMatchesNew.push([]);
            }
            const drawPool = arrayCopy(remainingMatchesNew);
            let drawnMatch;
            while (drawPool.length > 1) {
                const drawnMatchIndex = modules_1.Rand.int({ max: drawPool.length - 1 });
                drawnMatch = drawPool[drawnMatchIndex];
                drawPool.splice(drawnMatchIndex, 1);
                const drawnMatchesNewNew = arrayCopy(drawnMatchesNew);
                const remainingMatchesNewNew = remainingMatchesNew.filter((match) => {
                    return !drawnMatch.includes(match[0]) || !drawnMatch.includes(match[1]);
                });
                drawnMatchesNewNew[drawnMatchesNewNew.length - 1].push(drawnMatch);
                if (isOkay({ drawnMatch, drawnMatches: drawnMatchesNew[drawnMatchesNew.length - 1] }) && draw(drawnMatchesNewNew, remainingMatchesNewNew)) {
                    return true;
                }
            }
            return false;
        }
        console.log(drawnMatchesNew);
        return true;
    }
    function arrayCopy(value) {
        return (Array.isArray(value) && value.map((element) => {
            return arrayCopy(element);
        })) || value;
    }
    const leagueSize = 16;
    const drawnMatches = [[]];
    const remainingMatches = Array(leagueSize).fill(null).reduce((a, value, playerIndex) => {
        const arrayLength = leagueSize - playerIndex - 1;
        if (arrayLength > 0) {
            return [...a, ...Array(arrayLength).fill(null).map((valueOther, playerOtherIndex) => {
                    return [playerIndex, playerIndex + playerOtherIndex + 1];
                })];
        }
        return a;
    }, []);
    const dateStart = Date.now();
    draw(drawnMatches, remainingMatches);
    console.log(Date.now() - dateStart);
})();
//# sourceMappingURL=matchesDrawOld.js.map