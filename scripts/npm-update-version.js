const packageJson = require(`../package.json`);
const { writeFileSync } = require('fs');
const { exec } = require('child-process-promise');
const path = require('path');
const semver = require('semver');

const execRead = async (command, options) => {
    const { stdout } = await exec(command, options);
    return stdout.trim();
};

async function run() {
    try {
        const packageView = await execRead(
            `npm view ${packageJson.name} --json`
        );

        const { versions: publishedVersions } = JSON.parse(packageView);

        const suggestedVersion = semver.inc(packageJson.version, 'patch');

        if (publishedVersions.includes(suggestedVersion)) {
            packageJson.version = semver.inc(
                suggestedVersion,
                'patch',
            );
        } else {
            packageJson.version = suggestedVersion;
        }

        console.log(`Version: ${packageJson.version}`);

        writeFileSync(
            path.join(__dirname, '../package.json'),
            JSON.stringify(packageJson, undefined, 4)
        );
    } catch (e) {
        console.log(`An error occured`, e);
    }
}

run();
