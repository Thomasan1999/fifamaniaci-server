"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const params = {
    id: { min: 1, type: `integer` },
    awayGoals: { type: `integer` },
    canceledAt: { max: 120, min: 1, type: `integer` },
    canceledBy: { type: `alphabetical` },
    createdBy: { type: `string` },
    email: { type: `email` },
    fbLink: { type: `fbLink` },
    homeGoals: { type: `integer` },
    lang: { type: `alphabetical` },
    leagueRegistration: { type: `boolean` },
    limit: { min: 1, type: `integer` },
    message: { type: `message` },
    money: { min: -Number.MAX_VALUE, type: `float` },
    overtime: { type: `boolean` },
    password: { type: `password` },
    passwordCurrent: { type: `password` },
    passwordNew: { type: `password` },
    passwordResetToken: { type: `hexadecimal` },
    place: { min: 1, type: `integer` },
    playedAt: { type: `date` },
    transactionType: { type: `string` },
    username: { type: `username` },
    usernamesInGamePs: { length: { min: 3, max: 16 }, type: `username`, validateRegex: /^(\w|-|_)+$/i },
    usernamesInGameXbox: { length: { min: 3, max: 16 }, type: `username`, validateRegex: /^(.*)+$/i },
    usernamesInGamePc: { length: { min: 4, max: 16 }, type: `username`, validateRegex: /^(\w|-|_)+$/i },
    variableSymbol: { type: `integer` },
    verificationCode: { type: `alphanumerical` }
};
exports.default = params;
//# sourceMappingURL=params.js.map