import {createProject, createProjectPlugin, quiltPackage} from '@quilted/craft';

export default createProject((project) => {
  project.use(
    quiltPackage({
      executable: {
        'create-quilt': './source/cli.ts',
      },
      build: {bundle: true},
    }),
    createProjectPlugin({
      name: 'Quilt.Create.IgnoreTemplateTests',
      test({configure, project}) {
        configure(({jestIgnore}) => {
          jestIgnore?.((ignore) => [
            ...ignore,
            project.fs.resolvePath('templates'),
          ]);
        });
      },
    }),
  );
});
