"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VueString = void 0;
const remove_accents_1 = require("remove-accents");
const dictionary_1 = require("../../locales/sk/dictionary");
const __1 = require("..");
const _1 = require(".");
class VueString extends String {
    constructor(val = ``) {
        super(val);
    }
    capitalize() {
        return this.toString() ? new VueString(`${this[0].toUpperCase()}${this.slice(1)}`) : this;
    }
    caseCamelSplit() {
        return this.toString() ? this.split(/(?=[A-Z])/).map((word) => {
            return new VueString(word);
        }) : [];
    }
    caseCamelTo() {
        return this.toString() ? new VueString(this.replace(/([_|-]\w)/g, (word) => {
            return word[1].toUpperCase();
        })) : this;
    }
    caseSnakeTo() {
        return this.toString() ? new VueString(`${this[0].toLowerCase()}${this.slice(1).replace(/([A-Z][a-z])|([A-Z]$)/g, (match) => {
            return `_${match[0].toLowerCase()}${match[1] || ``}`;
        })}`.toLowerCase().replace(/ /g, `_`).replace(/__/g, `_`)) : this;
    }
    caseTrainTo() {
        return this.toString() ? new VueString(`${this[0].toLowerCase()}${this.slice(1).replace(/([A-Z][a-z])|([A-Z]$)/g, (match) => {
            return `-${match[0].toLowerCase()}${match[1] || ``}`;
        })}`.toLowerCase().replace(/ /g, `-`).replace(/--/g, `-`)) : this;
    }
    decapitalize() {
        return this.toString() ? new VueString(`${this[0].toLowerCase()}${this.slice(1)}`) : this;
    }
    diacriticsRemove() {
        return new VueString(remove_accents_1.remove(this.toString()));
    }
    htmlParse(variables = {}) {
        const replaceMap = {
            [`<b>`]: `<strong>`,
            [`</b>`]: `</strong>`,
            [`\n`]: `<br>`
        };
        return new VueString(this.replace(/\${[^}]*}/g, (expressionRaw) => {
            const variableName = expressionRaw.replace(/^\${/, ``).replace(/}$/, ``).replace(/env\.([A-Z]|_)+/, (variable) => {
                return process.env[`FM_${variable.split(`.`)[1]}`];
            });
            const [variableType] = variableName.match(/^\w+(?=\|)/) || [];
            const result = (() => {
                switch (variableType) {
                    case `currency`:
                        {
                            const [, variableOtherName] = variableName.split(`|`);
                            return new _1.VueNumber(typeof variables[variableOtherName] === `undefined` ? variableOtherName : variables[variableOtherName]).currencyFormat;
                        }
                    case `date`:
                        {
                            const [, format, date] = variableName.split(`|`);
                            const dateExpr = variables[date] || date;
                            return Number.isNaN(Date.parse(dateExpr)) ? `` : new _1.VueDate(dateExpr).format(format);
                        }
                    case `dictionary`:
                        {
                            const [, wordKey, type, variableOtherName, flags] = variableName.split(`|`);
                            const word = `${wordKey}.${type}`.split(`.`).reduce((a, selector) => {
                                return a && a[selector];
                            }, dictionary_1.default);
                            switch (type) {
                                case `number`:
                                    {
                                        const pluralIf = new __1.NumericRange(2, 4).includes(variables[variableOtherName]) ? word.a.pl : word.g.pl;
                                        return variables[variableOtherName] === 1 ? word.a.sg : pluralIf;
                                    }
                                default:
                                    if (flags) {
                                        let valueNew = new VueString(word);
                                        flags.split(`,`).forEach((flag) => {
                                            valueNew = valueNew[flag]();
                                        });
                                        return valueNew.toString();
                                    }
                                    return word;
                            }
                        }
                    case `href`:
                        {
                            const [, type, route, localization, flags] = variableName.split(`|`);
                            const prefix = (() => {
                                switch (type) {
                                    case `mail`:
                                        return `mailto:`;
                                    case `tel`:
                                        return `tel:`;
                                    default:
                                        return ``;
                                }
                            })();
                            const target = (type === `external` || (flags && flags.split(`,`).includes(`_blank`))) ? `target="_blank"` : ``;
                            return `<a href="${prefix}${route}" rel="noopener noreferrer" ${target}>${localization ? localization : route}</a>`;
                        }
                    default:
                        {
                            const variable = variables[variableName];
                            if (typeof variable === `number`) {
                                return new Intl.NumberFormat(`sk-SK`).format(variable);
                            }
                            return variable;
                        }
                }
            })();
            if (typeof result === `undefined`) {
                return expressionRaw;
            }
            return result;
        })).replaceArray(Object.keys(replaceMap), Object.values(replaceMap));
    }
    regexEscape() {
        return new VueString(this.replace(/([-[\]{}()*+?.\\^$|#,])/g, `\\$1`));
    }
    replaceArray(find = [], replace = []) {
        return new VueString(find.reduce((a, regexRaw, index) => {
            return a.replace(new RegExp(new VueString(regexRaw).regexEscape().toString(), `g`), replace[index]);
        }, this.toString()));
    }
    singularTo() {
        if (this.slice(-2) === `es`) {
            return new VueString(this.slice(0, -2));
        }
        if (this.slice(-1) === `s`) {
            return new VueString(this.slice(0, -1));
        }
        return this;
    }
    urlTo() {
        const url = this.diacriticsRemove().caseTrainTo().decapitalize();
        return url.toString();
    }
}
exports.VueString = VueString;
//# sourceMappingURL=VueString.js.map