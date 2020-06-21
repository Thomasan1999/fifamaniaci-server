import {remove}       from 'remove-accents';
import dictionary     from '../../locales/sk/dictionary';
import {NumericRange} from '..';
import {VueDate, VueNumber} from '.';

export class VueString extends String
{
    constructor(val: string | VueString = ``)
    {
        super(val);
    }

    public capitalize(): VueString
    {
        return this.toString() ? new VueString(`${this[0].toUpperCase()}${this.slice(1)}`) : this;
    }

    public caseCamelSplit(): VueString[]
    {
        return this.toString() ? this.split(/(?=[A-Z])/).map((word: string) =>
        {
            return new VueString(word);
        }) : [];
    }

    public caseCamelTo(): VueString
    {
        return this.toString() ? new VueString(this.replace(/([_|-]\w)/g, (word: string) =>
        {
            return word[1].toUpperCase();
        })) : this;
    }

    public caseSnakeTo(): VueString
    {
        return this.toString() ? new VueString(`${this[0].toLowerCase()}${this.slice(1).replace(/([A-Z][a-z])|([A-Z]$)/g, (match: string) =>
        {
            return `_${match[0].toLowerCase()}${match[1] || ``}`;
        })}`.toLowerCase().replace(/ /g, `_`).replace(/__/g, `_`)) : this;
    }

    public caseTrainTo(): VueString
    {
        return this.toString() ? new VueString(`${this[0].toLowerCase()}${this.slice(1).replace(/([A-Z][a-z])|([A-Z]$)/g, (match: string) =>
        {
            return `-${match[0].toLowerCase()}${match[1] || ``}`;
        })}`.toLowerCase().replace(/ /g, `-`).replace(/--/g, `-`)) : this;
    }

    public decapitalize(): VueString
    {
        return this.toString() ? new VueString(`${this[0].toLowerCase()}${this.slice(1)}`) : this;
    }

    public diacriticsRemove(): VueString
    {
        return new VueString(remove(this.toString()));
    }

    public htmlParse(variables: { [s: string]: any } = {}): VueString
    {
        const replaceMap: {
            [s: string]: string
        } = {
            [`<b>`]: `<strong>`,
            [`</b>`]: `</strong>`,
            [`\n`]: `<br>`
        };

        return new VueString(this.replace(/\${[^}]*}/g, (expressionRaw: string) =>
        {
            const variableName: string = expressionRaw.replace(/^\${/, ``).replace(/}$/, ``).replace(/env\.([A-Z]|_)+/, (variable) =>
            {
                return process.env[`FM_${variable.split(`.`)[1]}`];
            });

            const [variableType]: (string | undefined)[] = variableName.match(/^\w+(?=\|)/) || [];

            const result: any = (() =>
            {
                switch (variableType)
                {
                    case `currency`:
                    {
                        const [, variableOtherName] = variableName.split(`|`);

                        return new VueNumber(typeof variables[variableOtherName] === `undefined` ? variableOtherName : variables[variableOtherName]).currencyFormat;
                    }
                    case `date`:
                    {
                        const [, format, date] = variableName.split(`|`);

                        const dateExpr = variables[date] || date;

                        return Number.isNaN(Date.parse(dateExpr)) ? `` : new VueDate(dateExpr).format(format);
                    }
                    case `dictionary`:
                    {
                        const [, wordKey, type, variableOtherName, flags]: string[] = variableName.split(`|`);
                        const word = `${wordKey}.${type}`.split(`.`).reduce((a, selector) =>
                        {
                            return a && a[selector];
                        }, dictionary);

                        switch (type)
                        {
                            case `number`:
                            {
                                const pluralIf: string = new NumericRange(2, 4).includes(variables[variableOtherName]) ? word.a.pl : word.g.pl;
                                return variables[variableOtherName] === 1 ? word.a.sg : pluralIf;
                            }
                            default:
                                if (flags)
                                {
                                    let valueNew: VueString = new VueString(word);

                                    flags.split(`,`).forEach((flag) =>
                                    {
                                        valueNew = valueNew[flag]();
                                    });

                                    return valueNew.toString();
                                }

                                return word;
                        }
                    }
                    case `href`:
                    {
                        const [, type, route, localization, flags]: string[] = variableName.split(`|`);

                        const prefix: string = (() =>
                        {
                            switch (type)
                            {
                                case `mail`:
                                    return `mailto:`;
                                case `tel`:
                                    return `tel:`;
                                default:
                                    return ``;
                            }
                        })();

                        const target: string = (type === `external` || (flags && flags.split(`,`).includes(`_blank`))) ? `target="_blank"` : ``;

                        return `<a href="${prefix}${route}" rel="noopener noreferrer" ${target}>${localization ? localization : route}</a>`;
                    }
                    default:
                    {
                        const variable: any = variables[variableName];

                        if (typeof variable === `number`)
                        {
                            return new Intl.NumberFormat(`sk-SK`).format(variable);
                        }

                        return variable;
                    }
                }
            })();

            if (typeof result === `undefined`)
            {
                return expressionRaw;
            }

            return result;
        })).replaceArray(Object.keys(replaceMap), Object.values(replaceMap));
    }

    public regexEscape(): VueString
    {
        return new VueString(this.replace(/([-[\]{}()*+?.\\^$|#,])/g, `\\$1`));
    }

    public replaceArray(find: string[] = [], replace: string[] = []): VueString
    {
        return new VueString(find.reduce((a, regexRaw, index) =>
        {
            return a.replace(new RegExp(new VueString(regexRaw).regexEscape().toString(), `g`), replace[index]);
        }, this.toString()));
    }

    public singularTo(): VueString
    {
        if (this.slice(-2) === `es`)
        {
            return new VueString(this.slice(0, -2));
        }
        if (this.slice(-1) === `s`)
        {
            return new VueString(this.slice(0, -1));
        }

        return this;
    }

    public urlTo(): string
    {
        const url: VueString = this.diacriticsRemove().caseTrainTo().decapitalize();
        return url.toString();
    }
}
