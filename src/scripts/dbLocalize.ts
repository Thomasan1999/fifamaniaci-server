import * as path     from 'path';
import * as bcrypt   from 'bcrypt';
import * as Mongodb  from 'mongodb';
import * as dotenv   from 'dotenv';
import {ErrorCustom} from '../modules';
import {UserValue}   from '../modules/row/User';
import {spawn}       from 'child_process';

(async () =>
{
    class Db
    {
        static connect(): Promise<Mongodb.Db>
        {
            return (async () =>
            {
                const client: Mongodb.MongoClient = await Mongodb.MongoClient.connect(`mongodb://127.0.0.1:27017`, {useNewUrlParser: true});
                return client.db(`fifamaniaci`);
            })();
        }
    }

    await spawn(`mongorestore`, [`--drop`, `--db`, `fifamaniaci`, `c:\\users\\tomas\\webstormprojects\\fifamaniaci\\server\\backup\\fifamaniaci`], {shell: true});

    setTimeout(async () =>
    {
        dotenv.config({path: `${__dirname}/../.env`});

        const dirname: string = path.basename(__dirname);
        const filename: string = path.basename(__filename, `.js`);
        const pathRelative: string = path.join(dirname, filename);

        const db: Mongodb.Db = await Db.connect();

        const password: string = await bcrypt.hash(`123456`, 10);

        const users: UserValue[] = await db.collection(`users`).find({}).toArray();

        const promises: Promise<any>[] = [];

        promises.push(Promise.all(users.map(async ({id, username}) =>
        {
            return await db.collection(`users`).updateOne(
                {
                    id
                },
                {
                    $currentDate: {updated: true},
                    $set: {email: `${username.replace(/ /g, `_`).toLowerCase()}@email.com`, password}
                }
            ).catch((err) =>
            {
                new ErrorCustom({at: `${pathRelative} users.updateOne()`, err});
                return Promise.reject(err);
            });
        })));

        promises.push(db.collection(`messagesTabs`).deleteMany({}).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} messagesTabs.deleteMany()`, err});
        }));

        promises.push(db.collection(`messages`).deleteMany({addresseeId: {$exists: true}}).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} messages.deleteMany()`, err});
        }));

        await Promise.all(promises).catch((err) =>
        {
            new ErrorCustom({at: `${pathRelative} Promise.all()`, err});
        });

        process.exit();
    }, 2500);
})();
