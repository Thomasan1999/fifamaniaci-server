import * as path                            from 'path';
import * as Pg                              from 'pg';
import {CategoryQueryResult, CategoryValue} from '../../modules/row/Category';
import {MailOptions}                        from '../../modules/Mail';
import {ErrorCustom, Mail, Tomwork}         from '../../modules';
import {VueString}                          from '../../modules/types';

module.exports = async ({categoryId, email, pg, username, variableSymbol}: { categoryId: number, email: string, pg: Pg.Client, username: string, variableSymbol: number }) =>
{
    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const category: CategoryValue = await pg.query(`SELECT * FROM categories WHERE id = $1`, [categoryId]).then((result: CategoryQueryResult) =>
    {
        return Tomwork.queryParse(result).rows[0];
    });
    const categoryTitle: string = require(`json/categories`)[category.name];
    const categoryUrl: string = new VueString(category.name).urlTo();

    const options: MailOptions = {
        to: email,
        subject: `Letná ${categoryTitle} liga začína!`,
        html: `Ahoj, ${username},<br><br>dnes sa začína liga. Ďakujeme ti za tvoju registráciu, dosiahli sme rekord a to 29 registrácií naprieč všetkými šiestimi kategóriami.<br><br>Počínajúc dneškom budeme <b>každý pondelok</b> zverejňovať rozpis zápasov na najbližší týždeň. Tvojou úlohou je na začiatku alebo počas týždňa si rozpis pozrieť, skontaktovať sa so súpermi, s ktorými máš v daný týždeň odohrať zápasy a zápasy samozrejme aj odohrať. Po odohratí zápasov sa vždy dohodnite, kto zapíše výsledky. Urobiť tak môžete tu: \${href|external|https://fifamaniaci.app/${categoryUrl}/zapasy}.<br><br>Každý týždeň budeš mať v rozpise naplánovaných <b>maximálne 6 zápasov</b>. Ak vieš, že nejaký týždeň nebudeš môcť hrať (dovolenka alebo niečo), <b>treba nám to dať vedieť dopredu</b> buď na mail \${href|mail|ahoj@fifamaniaci.sk} alebo správou na fanpage: \${href|external|https://www.facebook.com/fifamaniaci/}.<br><br>Aby sme ti uľahčili kontaktovanie sa so súpermi, poprosíme ťa poslať nám <b>odpoveďou na tento mail link na tvoj FB účet, nick na konzole alebo oboje</b>. Následne zverejníme zoznam kontaktov na našej stránke: \${href|external|https://fifamaniaci.sk/letna-liga-kontakty/}.<br><br>Posledná dôležitá vec je <b>vstupné za ligu</b>. Ako sme už spomínali, prvý týždeň máš zadarmo, aby si si ligu odskúšal. Ak sa ti bude všetko pozdávať a budeš chcieť pokračovať, poprosíme ťa <b>najneskôr 18. júla</b> (19. júla musia byť peniaze u nás na účte) poslať peniaze na číslo účtu <b>${process.env.BANK_ACCOUNT_NUMBER}</b> s variabilným symbolom <b>${variableSymbol}</b>. Ak si tak už urobil, túto informáciu ignoruj.<br><bR>To je od nás všetko. Ak by si mal akékoľvek otázky, tak nám píš.<br><br>Tešíme sa na tvoju účasť a želáme veľa šťastia!<br>Tím FIFA maniaci`
    };

    const mail: Mail = new Mail({filename, options});

    return await mail.send().catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} Mail.send()`, err});
    });
};
