import * as path from 'path';
import {ErrorCustom, Mail} from '../../modules';
import {MailOptions} from '../../modules/Mail';

module.exports = async ({email, username, verificationCode}: { email: string, username: string, verificationCode: string}) =>
{
    const dirname: string = path.basename(__dirname);
    const filename: string = path.basename(__filename, `.js`);
    const pathRelative: string = path.join(dirname, filename);

    const verificationLink: string = `https://api.${process.env.FM_HOSTNAME}/users/verify?verificationCode=${verificationCode}`;

    const options: MailOptions = {
        to: email,
        subject: `Potvrdenie emailovej adresy`,
        html: `<p>Ahoj, ${username},<br><br>ďakujeme za registráciu na portáli FIFA maniaci. Klikni prosím na tlačidlo nižšie pre potvrdenie, že táto emailová adresa je tvoja:</p><p><a href="${verificationLink}"><button>Potvrdiť email</button></a></p><p>Ak sa ti nedá kliknúť na tlačidlo, skopíruj tento link do prehliadača: <a href="${verificationLink}">${verificationLink}</a></p><p>S pozdravom<br>tím FIFA maniaci</p>`
    };

    const mail: Mail = new Mail({filename, options});

    return await mail.send().catch((err) =>
    {
        new ErrorCustom({at: `${pathRelative} Mail.send()`, err});
    });
};
