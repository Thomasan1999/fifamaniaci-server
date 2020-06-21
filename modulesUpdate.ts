import {spawn} from 'child_process';

(async () =>
{
    const outdatedProcess = spawn(`npm.cmd`, [`outdated`]);
    const forbiddenPackageNames: (string | undefined)[] = [undefined, `Package`];

    outdatedProcess.stdout.on(`data`, async (data: Buffer) =>
    {
        const packageNames: string[] = data.toString().split(`\n`).map((packageLine) =>
        {
            return packageLine.match(`[^ ]+`)?.[0];
        }).filter((packageName) =>
        {
            return !forbiddenPackageNames.includes(packageName);
        }).map((packageName) =>
        {
            if (!packageName)
            {
                return ``;
            }

            return `${packageName}@latest`;
        });

        return new Promise((reject, resolve) =>
        {
            const installProcess = spawn(`npm.cmd`, [
                `i`,
                ...packageNames
            ]);

            installProcess.stderr.on(`data`, (err: Buffer) =>
            {
                console.log(`Error:`, err.toString());
                return reject(err.toString());
            });

            installProcess.on(`close`, (data2: Buffer) =>
            {
                console.log(`Packages successfully installed`);
                return resolve(data2.toString());
            });
        }).catch(console.error);
    });

    outdatedProcess.stderr.on(`data`, (data: Buffer) =>
    {
        console.log(data.toString());
    });

    outdatedProcess.on(`exit`, (exitCode: string) =>
    {
        console.log(`Process finished with exit code ${exitCode}`);
    });
})();
