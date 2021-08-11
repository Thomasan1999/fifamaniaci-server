"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Moment = require("moment-timezone");
const categories_1 = require("../../locales/sk/categories");
const modules_1 = require("../../modules");
const LeagueSeasons_1 = require("../../modules/table/LeagueSeasons");
module.exports = async ({ categoryId, email, pg, username, variableSymbol }) => {
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const category = await pg.query(`SELECT * FROM categories WHERE id = $1`, [categoryId]).then((result) => {
        return modules_1.Tomwork.queryParse(result).rows[0];
    });
    const categoryLocalization = categories_1.default[category.name];
    // const categoryUrl: string = new VueString(categoryLocalization).urlTo();
    const season = await new LeagueSeasons_1.LeagueSeasons({ pg }).findLast();
    const seasonDictionary = `leagueSeasons.months.${season.month}`;
    // const seasonUrl: string = new VueString(`\${dictionary|${seasonDictionary}|noun.n.sg}-${Moment(season.seasonStart).year()}`).htmlParse().urlTo();
    const seasonVariable = `\${dictionary|${seasonDictionary}|adjective.l.sg.f|_|capitalize}`;
    // const seasonAdjectiveNSg: string = new VueString(`\${dictionary|${seasonDictionary}|adjective.n.sg.f}`).htmlParse().urlTo();
    // const now: Moment.Moment = Moment();
    const seasonStart = Moment(season.seasonStart);
    const html = `<p>Ahoj, ${username},<br><br>ďakujeme ti za registráciu v ${seasonVariable} ${categoryLocalization} lige. Liga začína v <b>${seasonStart.toDate()
        .toLocaleString('sk-SK', {
        timeZone: `Europe/Bratislava`,
        weekday: `long`
    })} \${date|d.mmmm.|${seasonStart.format()}}</b>. Dovtedy môžeš hrať priateľské a kvalifikačné zápasy, aby si sa kvalifikoval do čo najvyššej divízie a hral o čo najvyššie ceny. Zápasy si môžeš dohadovať cez naše fórum: \${href|external|https://www.facebook.com/groups/701919070167135/}.<br><br><b>Vstup \${currency|env.LEAGUE_REGISTRATION_MONEY}</b> ťa poprosíme uhradiť <b>najneskôr \${date|d.mmmm.|${seasonStart.clone()
        .add(7, `d`)}}</b> na číslo účtu <b>${process.env.BANK_ACCOUNT_NUMBER}</b> s variabilným symbolom ${variableSymbol.toString()
        .padStart(10, `0`)} (\${date|d.mmmm.|${seasonStart.clone().add(9, `d`)}} musí byť u nás na účte). To znamená, že ligu si môžeš vyskúšať na týždeň zadarmo a ak by sa ti niečo nepozdávalo, proste nezaplatíš vstup a nebudeš pokračovať v súťaži.<br><br>To je od nás zatiaľ všetko, tešíme sa na teba už čoskoro.<br>Tím FIFA maniaci</p>`;
    const options = {
        to: email,
        subject: `Registrácia do ${seasonVariable} ${categoryLocalization} ligy`,
        html
    };
    const mail = new modules_1.Mail({ filename, options });
    return await mail.send().catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} Mail.send()`, err });
    });
};
//# sourceMappingURL=leagueRegistration.js.map