import {createRequire} from 'module';

import {
  createProjectPlugin,
  createWorkspacePlugin,
  type WaterfallHook,
} from '../kit.ts';

import type {} from '../tools/babel.ts';
import type {} from '../tools/eslint.ts';
import type {} from '../tools/jest.ts';
import type {} from '../tools/rollup.ts';

export interface TypeScriptHooks {
  typescriptHeap: WaterfallHook<number | undefined>;
}

declare module '@quilted/sewing-kit' {
  interface TypeCheckWorkspaceConfigurationHooks extends TypeScriptHooks {}
  interface BuildWorkspaceConfigurationHooks extends TypeScriptHooks {}
}

const require = createRequire(import.meta.url);

/**
 * Adds configuration for TypeScript to a variety of other build tools.
 */
export function typescriptProject() {
  return createProjectPlugin({
    name: 'Quilt.TypeScript',
    build({configure}) {
      configure(({extensions, babelPresets, babelPlugins}) => {
        // Let us import from TypeScript files without extensions
        extensions((extensions) =>
          Array.from(new Set(['.tsx', '.ts', ...extensions])),
        );

        // Add TypeScript compilation to Babel
        babelPresets?.((presets) => [
          ...presets,
          require.resolve('@babel/preset-typescript'),
        ]);

        babelPlugins?.((plugins) => [
          ...plugins,
          [
            require.resolve('@babel/plugin-proposal-decorators'),
            {version: '2023-01'},
          ],
        ]);
      });
    },
    develop({configure}) {
      configure(({extensions, babelPresets, babelPlugins}) => {
        // Let us import from TypeScript files without extensions
        extensions((extensions) =>
          Array.from(new Set(['.tsx', '.ts', ...extensions])),
        );

        // Add TypeScript compilation to Babel
        babelPresets?.((presets) => [
          ...presets,
          require.resolve('@babel/preset-typescript'),
        ]);

        babelPlugins?.((plugins) => [
          ...plugins,
          [
            require.resolve('@babel/plugin-proposal-decorators'),
            {version: '2023-01'},
          ],
        ]);
      });
    },
    test({configure}) {
      configure(
        ({jestExtensions, jestTransforms, babelPresets, babelPlugins}) => {
          babelPresets?.((presets) => [
            ...presets,
            require.resolve('@babel/preset-typescript'),
          ]);

          babelPlugins?.((plugins) => [
            ...plugins,
            [
              require.resolve('@babel/plugin-proposal-decorators'),
              {version: '2023-01'},
            ],
          ]);

          // Add TypeScript extensions for project-level tests
          jestExtensions?.((extensions) =>
            Array.from(new Set([...extensions, '.ts', '.tsx'])),
          );

          jestTransforms?.(async (transforms) => {
            if (babelPresets == null || babelPlugins == null) {
              return transforms;
            }

            const [presets, plugins] = await Promise.all([
              babelPresets.run([]),
              babelPlugins.run([]),
            ]);

            transforms['\\.tsx?$'] = [
              require.resolve('babel-jest'),
              {
                presets,
                plugins,
                configFile: false,
                babelrc: false,
                targets: 'current node',
              },
            ];
            return transforms;
          });
        },
      );
    },
  });
}

/**
 * Runs TypeScript at using project references from the root of your
 * workspace, and configures TypeScript for workspace-level tools like
 * ESLint.
 */
export function typescriptWorkspace() {
  return createWorkspacePlugin({
    name: 'Quilt.TypeScript',
    build({workspace, hooks, configure, run}) {
      hooks<TypeScriptHooks>(({waterfall}) => ({typescriptHeap: waterfall()}));

      configure(({babelPresets, babelPlugins}) => {
        babelPresets?.((presets) => [
          ...presets,
          require.resolve('@babel/preset-typescript'),
        ]);

        babelPlugins?.((plugins) => [
          ...plugins,
          [
            require.resolve('@babel/plugin-proposal-decorators'),
            {version: '2023-01'},
          ],
        ]);
      });

      // We only need to run a TypeScript build if there are public projects
      if (
        workspace.projects.every(
          (project) => project.packageJson?.private ?? false,
        )
      ) {
        return;
      }

      run((step, {configuration}) =>
        step({
          name: 'Quilt.TypeScript',
          label:
            'Building type definitions for public packages in the workspace',
          async run(step) {
            const {typescriptHeap} = await configuration();
            const heap = await typescriptHeap!.run(undefined);
            const heapOption = heap
              ? `--max-old-space-size=${heap}`
              : undefined;

            await step.exec('tsc', ['--build'], {
              env: {
                ...process.env,
                FORCE_COLOR: '1',
                NODE_OPTIONS: heapOption,
              },
              fromNodeModules: import.meta.url,
            });
          },
        }),
      );
    },
    develop({configure}) {
      configure(({babelPresets, babelPlugins}) => {
        babelPresets?.((presets) => [
          ...presets,
          require.resolve('@babel/preset-typescript'),
        ]);

        babelPlugins?.((plugins) => [
          ...plugins,
          [
            require.resolve('@babel/plugin-proposal-decorators'),
            {version: '2023-01'},
          ],
        ]);
      });
    },
    lint({configure}) {
      configure(({eslintExtensions}) => {
        // Add TypeScript linting to ESLint
        eslintExtensions?.((extensions) =>
          Array.from(new Set([...extensions, '.ts', '.tsx'])),
        );
      });
    },
    test({configure}) {
      configure(
        ({
          jestExtensions,
          jestTransforms,
          babelPresets,
          babelPlugins,
          babelTargets,
        }) => {
          babelPresets?.((presets) => [
            ...presets,
            require.resolve('@babel/preset-typescript'),
          ]);

          babelPlugins?.((plugins) => [
            ...plugins,
            [
              require.resolve('@babel/plugin-proposal-decorators'),
              {version: '2023-01'},
            ],
          ]);

          // Add TypeScript extensions for workspace-level tests
          jestExtensions?.((extensions) =>
            Array.from(new Set([...extensions, '.ts', '.tsx'])),
          );

          jestTransforms?.(async (transforms) => {
            if (
              babelPresets == null ||
              babelPlugins == null ||
              babelTargets == null
            ) {
              return transforms;
            }

            const [presets, plugins, targets] = await Promise.all([
              babelPresets.run([]),
              babelPlugins.run([]),
              babelTargets.run(['current node']),
            ]);

            transforms['\\.tsx?$'] = [
              require.resolve('babel-jest'),
              {
                presets,
                plugins,
                configFile: false,
                babelrc: false,
                targets,
              },
            ];
            return transforms;
          });
        },
      );
    },
    typeCheck({hooks, run}) {
      hooks<TypeScriptHooks>(({waterfall}) => ({typescriptHeap: waterfall()}));

      run((step, {configuration}) =>
        step({
          name: 'Quilt.TypeScript',
          label: 'Run TypeScript on your workspace',
          async run(step) {
            const {typescriptHeap} = await configuration();
            const heap = await typescriptHeap!.run(undefined);
            const heapOption = heap
              ? `--max-old-space-size=${heap}`
              : undefined;

            await step.exec('tsc', ['--build', '--pretty'], {
              env: {
                ...process.env,
                FORCE_COLOR: '1',
                NODE_OPTIONS: heapOption,
              },
              fromNodeModules: import.meta.url,
            });
          },
        }),
      );
    },
  });
}
