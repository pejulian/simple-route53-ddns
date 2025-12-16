import packageJson from '../package.json' with { type: 'json' };
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child-process-promise';
import path from 'path';
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

        const suggestedVersion = semver.inc(packageJson.version, 'patch');

        if (suggestedVersion) {
            if (publishedVersions.includes(suggestedVersion)) {
                const suggestedPatchVersion = semver.inc(
                    suggestedVersion,
                    'patch'
                );
                if (suggestedPatchVersion) {
                    packageJson.version = suggestedPatchVersion;
                }
            } else {
                packageJson.version = suggestedVersion;
            }
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
