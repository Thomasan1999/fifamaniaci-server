import * as gulp from 'gulp';
import {spawn} from 'child_process';

gulp.task(`nodemon`, () =>
{
    const {stdout, stderr} = spawn(`nodemon.cmd`, [`--exec`, `npm`, `start`]);

    stdout.on(`data`, (data) =>
    {
        console.log(data.toString());
    });

    stderr.on(`data`, (data) =>
    {
        console.log(data.toString());
    });
});
