import * as Pg           from 'pg';
import * as Mongodb      from 'mongodb';
import * as dotenv       from 'dotenv';
import * as pgFormat     from 'pg-format';
import {VueString}       from '../modules/types';

dotenv.config({path: `${__dirname}/../.env`});

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

    const mongodbClient: Mongodb.Db = await Db.connect();

    const pgClient: Pg.Client = new Pg.Client({
        host: `localhost`,
        port: 5432,
        user: `postgres`,
        password: process.env.PG_PASSWORD,
        database: `fifamaniaci`
    });

    await pgClient.connect().catch((err) =>
    {
        console.error(err);
    });

    const columnNameGet: (propName: string) => string = ((propName: string) =>
    {
        if (propName === `_id`)
        {
            return `objectid`;
        }

        return new VueString(propName).caseSnakeTo().toString();
    });

    const insertColumns: string[] = [`objectid`, `username`];

    const rows: { _id: Mongodb.ObjectId, username: string }[] = await mongodbClient.collection(`users`).find({}).project({_id: true, username: true}).toArray();

    if (!rows.length)
    {
        return;
    }

    const values: string = rows.map((row) =>
    {
        return `(${insertColumns.sort((columnNameA, columnNameB) =>
        {
            return insertColumns.indexOf(columnNameA) - insertColumns.indexOf(columnNameB);
        }).map((columnName) =>
        {
            switch (columnName)
            {
                case `username`:
                    return `'${row.username}'`;
                case `objectid`:
                    return `'${(row._id as Mongodb.ObjectId).toHexString()}'`;
            }
        }).join(`,`)})`;
    }).join(`,`);

    const insertColumnsString: string = insertColumns.map((columnName) =>
    {
        return columnNameGet(columnName);
    }).join(`,`);

    await pgClient.query(pgFormat(`INSERT INTO users_objectids (%s) VALUES%s;`, insertColumnsString, values)).catch((err) =>
    {
        console.error(err);
        console.log(`INSERT INTO users_objectids (${insertColumnsString}) VALUES${values};`);
        process.exit(1);
    });

    process.exit();
})();
