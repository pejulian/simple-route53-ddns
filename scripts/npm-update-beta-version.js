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

        const suggestedVersion = semver.inc(
            packageJson.version,
            'prerelease',
            undefined,
            'beta'
        );

        if (publishedVersions.includes(suggestedVersion)) {
            packageJson.version = semver.inc(
                suggestedVersion,
                'prerelease',
                undefined,
                'beta'
            )
        } else {
            packageJson.version = suggestedVersion;
        }
    } catch (e) {
        packageJson.version = semver.inc(
            packageJson.version,
            'prerelease',
            undefined,
            'beta'
        );
    } finally {
        console.log(`Version: ${packageJson.version}`);
        writeFileSync(
            path.join(__dirname, '../package.json'),
            JSON.stringify(packageJson, undefined, 4)
        );
    }
}

run();
