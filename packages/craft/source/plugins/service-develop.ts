import * as path from 'path';
import {spawn} from 'child_process';
import type {ChildProcess} from 'child_process';

import {createProjectPlugin} from '../kit.ts';

export function serviceDevelopment() {
  return createProjectPlugin({
    name: 'Quilt.RequestRouter.Development',
    develop({project, run}) {
      run((step, {configuration}) =>
        step({
          name: 'Quilt.RequestRouter.Development',
          label: `Running local development server for ${project.name}`,
          async run() {
            const file = project.fs.buildPath(
              'develop/quilt-request-router/built.js',
            );

            const [
              {watch},
              {rollupInput, rollupExternals, rollupPlugins, rollupInputOptions},
            ] = await Promise.all([
              import('rollup'),
              configuration({quiltRequestRouter: true}),
            ]);

            const [input, plugins, external] = await Promise.all([
              rollupInput!.run([]),
              rollupPlugins!.run([]),
              rollupExternals!.run([]),
            ]);

            const [inputOptions] = await Promise.all([
              rollupInputOptions!.run({
                input,
                plugins,
                external,
                preserveEntrySignatures: 'exports-only',
              }),
            ]);

            if ((inputOptions.input ?? []).length === 0) {
              return;
            }

            let server: ChildProcess | undefined;

            const watcher = watch({
              ...inputOptions,
              output: {
                format: 'esm',
                dir: path.dirname(file),
                entryFileNames: path.basename(file),
                assetFileNames: `[name].[hash].[ext]`,
                chunkFileNames: `[name].[hash].js`,
              },
            });

            watcher.on('event', (event) => {
              switch (event.code) {
                case 'BUNDLE_END': {
                  try {
                    server?.kill();
                  } catch {
                    // intentional noop
                  }

                  server = spawn('node', [file], {
                    stdio: 'inherit',
                  });
                  break;
                }
                case 'ERROR': {
                  // eslint-disable-next-line no-console
                  console.error(event.error);
                  break;
                }
              }
            });
          },
        }),
      );
    },
  });
}
