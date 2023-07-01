const packageJson = (
    await import('./package.json', {
        assert: { type: 'json' }
    })
).default;

import { nodeExternalsPlugin } from 'esbuild-node-externals';
import esbuild, { BuildOptions } from 'esbuild';

const commonArgs: BuildOptions = {
    entryPoints: ['./src/index.ts'],
    minifySyntax: true,
    mangleQuoted: true,
    logLevel: 'info',
    platform: 'node',
    mainFields: ['module', 'main'],
    bundle: true,
    sourcemap: 'external',
    allowOverwrite: true,
    legalComments: 'external',
    minify: true,
    plugins: [
        nodeExternalsPlugin({
            //         allowList: [...Object.keys(packageJson.dependencies)]
        })
    ],
    banner: {
        js: [
            '#!/usr/bin/env node',
            `/* ${packageJson.name} - ${new Date().toLocaleDateString()} */`
        ].join('\n')
    },
    define: {
        'process.env.MODULE_NAME': JSON.stringify(`${packageJson.name}`),
        'process.env.MODULE_DESCRIPTION': JSON.stringify(
            `${packageJson.description}`
        ),
        'process.env.MODULE_VERSION': JSON.stringify(`${packageJson.version}`),
        'process.env.ESBUILD_PACKAGE': JSON.stringify(`webpack`)
    }
};

const esmBuild = esbuild.build({
    ...commonArgs,
    tsconfig: './tsconfig.esm.json',
    target: 'es2020',
    format: 'esm',
    outdir: './dist',
    outExtension: {
        '.js': '.js'
    },
    banner: {
        js: [
            commonArgs.banner?.js ?? '',
            `import { createRequire } from 'module';`,
            'const require = createRequire(import.meta.url);'
        ].join('\n')
    }
});

await Promise.all([esmBuild]);
