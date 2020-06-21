export class VueDate extends Date
{
    public format(format): string
    {
        const [date, time]: string[] = format.split(` `);
        const [day, month, year]: string[] = date.split(`.`);
        const [hour, minute, second]: string[] = (time || ``).split(`:`);

        return new Intl.DateTimeFormat(`sk-SK`, {
            day: {[`d`]: `numeric`, [`dd`]: `2-digit`}[day],
            hour: {[`h`]: `numeric`, [`hh`]: `2-digit`}[hour],
            minute: {[`m`]: `numeric`, [`mm`]: `2-digit`}[minute],
            month: {[`m`]: `numeric`, [`mm`]: `2-digit`, [`mmm`]: `short`, [`mmmm`]: `long`}[month],
            second: {[`s`]: `numeric`, [`ss`]: `2-digit`}[second],
            timeZone: `Europe/Bratislava`,
            year: {[`yy`]: `2-digit`, [`yyyy`]: `numeric`}[year],
        }).format(this).replace(/, /, ` `);
    }
}
