import * as path           from 'path';
import {ErrorCustom, Mail} from '../../modules';
import {MailOptions}       from '../../modules/Mail';

module.exports = async ({email, passwordResetToken, username}: { email: string, passwordResetToken: string, username: string}) =>
{
    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const resetLink: string = `https://${process.env.FM_HOSTNAME}/zmena-hesla?email=${email}&passwordResetToken=${passwordResetToken}`;

    const options: MailOptions = {
        to: email,
        subject: `Žiadosť o zmenu hesla`,
        html: `<p>Ahoj, ${username},<br><br>zaznamenali sme žiadosť o zmenu hesla. Klikni prosím na tlačidlo nižšie a budeš presmerovaný na odkaz, kde si ho budeš môct zmeniť:</p><p><a href="${resetLink}"><button>Zmeniť heslo</button></a></p><p>Ak sa ti nedá kliknúť na tlačidlo, skopíruj tento link do prehliadača: <a href="${resetLink}">${resetLink}</a></p><p>S pozdravom<br>tím FIFA maniaci</p>`
    };

    const mail: Mail = new Mail({filename, options});

    return await mail.send().catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} Mail.send()`, err});
    });
};
