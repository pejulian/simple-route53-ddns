import packageJson from '../package.json' with { type: 'json' };
import path from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';
import { exec } from 'child-process-promise';
import semver from 'semver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execRead = async (...args: Parameters<typeof exec>) => {
    const { stdout } = await exec(...args);
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

        if (suggestedVersion) {
            if (publishedVersions.includes(suggestedVersion)) {
                const suggestedBetaVersion = semver.inc(
                    suggestedVersion,
                    'prerelease',
                    undefined,
                    'beta'
                );

                if (suggestedBetaVersion) {
                    packageJson.version = suggestedBetaVersion;
                }
            } else {
                packageJson.version = suggestedVersion;
            }
        }
        // eslint-disable-next-line
    } catch (e) {
        const suggestedBetaVersion = semver.inc(
            packageJson.version,
            'prerelease',
            undefined,
            'beta'
        );

        if (suggestedBetaVersion) {
            packageJson.version = suggestedBetaVersion;
        }
    } finally {
        console.log(`Version: ${packageJson.version}`);
        writeFileSync(
            path.join(__dirname, '../package.json'),
            JSON.stringify(packageJson, undefined, 4)
        );
    }
}

run();
