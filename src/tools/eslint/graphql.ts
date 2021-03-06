import {join} from 'path';
import {execSync} from 'child_process';
import {mkdirp, writeFile} from 'fs-extra';

import Runner from '../../runner';
import {Workspace} from '../../workspace';
import buildGraphQL from '../graphql';
import {graphQLSchemaPath, graphQLDirectoryGlobPattern} from '../utilities';

const TASK = Symbol('GraphQLLint');

export default async function runGraphQLLint(workspace: Workspace, runner: Runner) {
  if (
    !workspace.project.usesGraphQL ||
    runner.hasPerformed(TASK)
  ) { return; }

  runner.perform(TASK);
  await buildGraphQL(workspace, runner);

  const {paths} = workspace;
  const executable = join(paths.ownNodeModules, '.bin/eslint');
  const configPath = join(paths.private, 'eslint-graphql.config.js');
  
  await mkdirp(paths.private);
  await writeFile(configPath, `
    module.exports = {
      parserOptions: {ecmaVersion: 6},
      plugins: ['graphql'],
      rules: {
        'graphql/template-strings': ['error', {
          env: 'literal',
          schemaJsonFilepath: ${JSON.stringify(graphQLSchemaPath(workspace))},
        }],
      },
    };
  `);

  try {
    execSync(`${JSON.stringify(executable)} ${JSON.stringify(graphQLDirectoryGlobPattern(workspace))} --max-warnings 0 --config ${JSON.stringify(configPath)} --ext '.graphql'`, {stdio: 'inherit'});
  } catch (error) {
    process.exit(1);
  }
}
