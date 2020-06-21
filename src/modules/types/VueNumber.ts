export class VueNumber extends Number
{
    public get currencyFormat(): string
    {
        return new Intl.NumberFormat(
            `sk-SK`,
            {
                style: `currency`,
                currency: `EUR`
            }
            // @ts-ignore
        ).format(this).replace(/\s+(?=[^\d]+$)/, ``).replace(/[^\d]00(?=[^\d])/, ``);
    }
}
