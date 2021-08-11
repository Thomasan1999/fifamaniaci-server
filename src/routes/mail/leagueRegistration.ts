import * as path                            from 'path';
import * as Moment                          from 'moment-timezone';
import * as Pg       from 'pg';
import categories    from '../../locales/sk/categories';
import {MailOptions} from '../../modules/Mail';
import {LeagueSeasonValue}                  from '../../modules/row/LeagueSeason';
import {CategoryQueryResult, CategoryValue} from '../../modules/row/Category';
import {ErrorCustom, Mail, Tomwork}         from '../../modules';
import {LeagueSeasons}                      from '../../modules/table/LeagueSeasons';

module.exports = async ({categoryId, email, pg, username, variableSymbol}: { categoryId: number, email: string, pg: Pg.Client, username: string, variableSymbol: number }) =>
{
    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const category: CategoryValue = await pg.query(`SELECT * FROM categories WHERE id = $1`, [categoryId]).then((result: CategoryQueryResult)=>
    {
        return Tomwork.queryParse(result).rows[0];
    });

    const categoryLocalization: string = categories[category.name];
    // const categoryUrl: string = new VueString(categoryLocalization).urlTo();
    const season: LeagueSeasonValue = await new LeagueSeasons({pg}).findLast();

    const seasonDictionary: string = `leagueSeasons.months.${season.month}`;

    // const seasonUrl: string = new VueString(`\${dictionary|${seasonDictionary}|noun.n.sg}-${Moment(season.seasonStart).year()}`).htmlParse().urlTo();

    const seasonVariable: string = `\${dictionary|${seasonDictionary}|adjective.l.sg.f|_|capitalize}`;

    // const seasonAdjectiveNSg: string = new VueString(`\${dictionary|${seasonDictionary}|adjective.n.sg.f}`).htmlParse().urlTo();

    // const now: Moment.Moment = Moment();

    const seasonStart: Moment.Moment = Moment(season.seasonStart);

    const html: string = `<p>Ahoj, ${username},<br><br>ďakujeme ti za registráciu v ${seasonVariable} ${categoryLocalization} lige. Liga začína v <b>${seasonStart.toDate()
        .toLocaleString('sk-SK', {
            timeZone: `Europe/Bratislava`,
            weekday: `long`
        })} \${date|d.mmmm.|${seasonStart.format()}}</b>. Dovtedy môžeš hrať priateľské a kvalifikačné zápasy, aby si sa kvalifikoval do čo najvyššej divízie a hral o čo najvyššie ceny. Zápasy si môžeš dohadovať cez naše fórum: \${href|external|https://www.facebook.com/groups/701919070167135/}.<br><br><b>Vstup \${currency|env.LEAGUE_REGISTRATION_MONEY}</b> ťa poprosíme uhradiť <b>najneskôr \${date|d.mmmm.|${seasonStart.clone()
        .add(7, `d`)}}</b> na číslo účtu <b>${process.env.BANK_ACCOUNT_NUMBER}</b> s variabilným symbolom ${variableSymbol.toString()
        .padStart(10, `0`)} (\${date|d.mmmm.|${seasonStart.clone().add(9,
        `d`)}} musí byť u nás na účte). To znamená, že ligu si môžeš vyskúšať na týždeň zadarmo a ak by sa ti niečo nepozdávalo, proste nezaplatíš vstup a nebudeš pokračovať v súťaži.<br><br>To je od nás zatiaľ všetko, tešíme sa na teba už čoskoro.<br>Tím FIFA maniaci</p>`;

    const options: MailOptions = {
        to: email,
        subject: `Registrácia do ${seasonVariable} ${categoryLocalization} ligy`,
        html
    };

    const mail: Mail = new Mail({filename, options});

    return await mail.send().catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} Mail.send()`, err});
    });
};
