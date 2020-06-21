"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const modules_1 = require("../../modules");
module.exports = async ({ email, passwordResetToken, username }) => {
    const dirname = path.basename(__dirname);
    const filename = path.basename(__filename, `.js`);
    const pathRelative = path.join(dirname, filename);
    const resetLink = `https://${process.env.FM_HOSTNAME}/zmena-hesla?email=${email}&passwordResetToken=${passwordResetToken}`;
    const options = {
        to: email,
        subject: `Žiadosť o zmenu hesla`,
        html: `<p>Ahoj, ${username},<br><br>zaznamenali sme žiadosť o zmenu hesla. Klikni prosím na tlačidlo nižšie a budeš presmerovaný na odkaz, kde si ho budeš môct zmeniť:</p><p><a href="${resetLink}"><button>Zmeniť heslo</button></a></p><p>Ak sa ti nedá kliknúť na tlačidlo, skopíruj tento link do prehliadača: <a href="${resetLink}">${resetLink}</a></p><p>S pozdravom<br>tím FIFA maniaci</p>`
    };
    const mail = new modules_1.Mail({ filename, options });
    return await mail.send().catch((err) => {
        new modules_1.ErrorCustom({ at: `${pathRelative} Mail.send()`, err });
    });
};
//# sourceMappingURL=passwordReset.js.map