export type CookiesValue = {
    id?: number,
    categoriesActive?: number,
    divisionsActive?: number,
    leagueSeasonsActive?: number,
    leagueTabsActive?: number,
    messagesTabsActive?: number,
    sectionsActive?: number,
    token?: string
}

export class Cookies
{
    public value: CookiesValue;

    constructor({value}: {value?: string})
    {
        this.value = value ? Cookies.parse({value}) : {};
    }

    public static parse({value}: {value: string}): CookiesValue
    {
        return value.split(`;`).reduce((a, cookiePart) =>
        {
            const [cookieKey, cookieValue] = cookiePart.trim().replace(/= /g, `=`).split(`=`).map(decodeURIComponent);

            a[cookieKey] = (cookieKey.includes(`Active`) || cookieKey.match(/^id$|(Id)/)) ? Number(cookieValue) : cookieValue;

            return a;
        }, {});
    }

    public update({value}): void
    {
        this.value = {...this.value, ...Cookies.parse({value})};
    }
}
