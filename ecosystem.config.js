module.exports = {
    apps: [
        {
            error: './logs/app_err.log',
            interpreter: '/usr/local/bin/node',
            log: './logs/app_log.log',
            node_args: '--icu-data-dir=node_modules/full-icu',
            output: './logs/app_out.log',
            name: 'fifamaniaci',
            script: './dist/app.js'
        }
    ]
};
