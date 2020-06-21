import {Query}                           from '../../modules';
import {RouteArguments}                  from '../../types/routes';
import {QueryParamsArgument, QueryValue} from '../../modules/Query';
import {pathExists, promises as fs}      from 'fs-extra';
import * as path                         from 'path';

module.exports = ({app, route}: RouteArguments) =>
{
    app.get(route, async (req, res) =>
    {
        const params: QueryParamsArgument = {
            lang: {}
        };

        type QueryThis = Merge<Query, { value: Pick<QueryValue, 'lang'> }>

        const query: QueryThis = new Query({authRequired: false, params, query: req.query, res}) as QueryThis;

        if (!query.valid)
        {
            return;
        }

        const localesDir: string = path.resolve(__dirname, `../../locales`);
        const localesPath: string = path.resolve(localesDir, query.value.lang, `index.js`);

        if (!await pathExists(localesPath))
        {
            res.status(400).json({message: `Locale not found`});
            return;
        }

        res.json(require(localesPath).default);
    });
};
