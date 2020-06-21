"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const modules_1 = require("../../modules");
module.exports = async ({ email, username, verificationCode }) => {
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const verificationLink = `https://api.${process.env.FM_HOSTNAME}/users/verify?verificationCode=${verificationCode}`;
    const options = {
        to: email,
        subject: `Potvrdenie emailovej adresy`,
        html: `<p>Ahoj, ${username},<br><br>ďakujeme za registráciu na portáli FIFA maniaci. Klikni prosím na tlačidlo nižšie pre potvrdenie, že táto emailová adresa je tvoja:</p><p><a href="${verificationLink}"><button>Potvrdiť email</button></a></p><p>Ak sa ti nedá kliknúť na tlačidlo, skopíruj tento link do prehliadača: <a href="${verificationLink}">${verificationLink}</a></p><p>S pozdravom<br>tím FIFA maniaci</p>`
    };
    const mail = new modules_1.Mail({ filename, options });
    return await mail.send().catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} Mail.send()`, err });
    });
};
//# sourceMappingURL=verify.js.map