import {Rand}           from '../modules';
import {promises as fs} from 'fs-extra';
import * as path        from 'path';

export type MatchesDrawMatch = [number, number];

(async ()=>
{
    const proposalsDirPath: string = path.resolve(__dirname, `..`, `proposals`);
    const proposalsDir: string[] = await fs.readdir(proposalsDirPath);

    proposalsDir.forEach((filename) =>
    {
        require(path.resolve(proposalsDirPath, filename));
    });

    function isOkay({drawnMatch, drawnMatches = []}: { drawnMatch: MatchesDrawMatch, drawnMatches: MatchesDrawMatch[] }): boolean
    {
        return drawnMatches.every((match) =>
        {
            return !match.includes(drawnMatch[0]) && !match.includes(drawnMatch[1]);
        });
    }

    function draw(drawnMatches: MatchesDrawMatch[][], remainingMatches: MatchesDrawMatch[]): boolean
    {
        const drawnMatchesNew: MatchesDrawMatch[][] = arrayCopy(drawnMatches);
        const remainingMatchesNew: MatchesDrawMatch[] = arrayCopy(remainingMatches);

        if (remainingMatchesNew.length > 6)
        {
            if (Math.floor(leagueSize / 2) === drawnMatchesNew[drawnMatches.length - 1].length)
            {
                drawnMatchesNew.push([]);
            }

            const drawPool: MatchesDrawMatch[] = arrayCopy(remainingMatchesNew);
            let drawnMatch: MatchesDrawMatch;

            while (drawPool.length > 1)
            {
                const drawnMatchIndex: number = Rand.int({max: drawPool.length - 1});
                drawnMatch = drawPool[drawnMatchIndex];
                drawPool.splice(drawnMatchIndex, 1);

                const drawnMatchesNewNew = arrayCopy(drawnMatchesNew);
                const remainingMatchesNewNew = remainingMatchesNew.filter((match) =>
                {
                    return !drawnMatch.includes(match[0]) || !drawnMatch.includes(match[1]);
                });

                drawnMatchesNewNew[drawnMatchesNewNew.length - 1].push(drawnMatch);

                if (isOkay({drawnMatch, drawnMatches: drawnMatchesNew[drawnMatchesNew.length - 1]}) && draw(drawnMatchesNewNew, remainingMatchesNewNew))
                {
                    return true;
                }
            }

            return false;
        }

        console.log(drawnMatchesNew);
        return true;
    }

    function arrayCopy(value: any): any
    {
        return (Array.isArray(value) && value.map((element: any[]) =>
        {
            return arrayCopy(element);
        })) || value;
    }

    const leagueSize: number = 16;

    const drawnMatches: MatchesDrawMatch[][] = [[]];
    const remainingMatches: MatchesDrawMatch[] = Array(leagueSize).fill(null).reduce((a, value, playerIndex) =>
    {
        const arrayLength: number = leagueSize - playerIndex - 1;
        if (arrayLength > 0)
        {
            return [...a, ...Array(arrayLength).fill(null).map((valueOther, playerOtherIndex) =>
            {
                return [playerIndex, playerIndex + playerOtherIndex + 1];
            })];
        }

        return a;
    }, []);

    const dateStart: number = Date.now();
    draw(drawnMatches, remainingMatches);
    console.log(Date.now() - dateStart);
})()
