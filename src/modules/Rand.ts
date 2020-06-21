export class Rand
{
    static float({min = 0, max = Number.MAX_SAFE_INTEGER}: {min?: number, max?: number} = {}): number
    {
        return (Math.random() * (max - min)) + min;
    }

    static int({min = 0, max = Number.MAX_SAFE_INTEGER}: {min?: number, max?: number} = {}): number
    {
        return Math.floor((Math.random() * (max - min + 1))) + min;
    }
}
