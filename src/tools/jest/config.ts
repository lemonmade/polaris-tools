import * as path from 'path';
import {Workspace} from '../../workspace';
import {removeNullValues, ifElse, flatten} from '../../utilities';

export interface Config {
  [key: string]: any,
}

export default async function jestConfig(workspace: Workspace): Promise<Config> {
  const {root, paths, project: {usesPolaris}} = workspace;

  const fileMatcher = usesPolaris
    ? '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$'
    : '\\.(jpg|jpeg|png|gif|svg|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$';
  
  const transformsRoot = path.join(paths.ownRoot, 'jest', 'transformers');
  const jestConfig = workspace.config.for('jest');
  
  return {
    rootDir: root,
    setupFiles: flatten([
      path.join(paths.ownRoot, 'jest', 'polyfills.js'),
      jestConfig && jestConfig.setupRun,
    ]),
    setupTestFrameworkScriptFile: jestConfig && jestConfig.setupTest,
    testRegex: '.*\\.(test|integration)\\.(js|ts)x?$',
    transform: removeNullValues({
      '\\.jsx?$': path.join(transformsRoot, 'javascript.js'),
      '\\.tsx?$': path.join(transformsRoot, 'typescript.js'),
      '\\.svg$': ifElse(usesPolaris, path.join(transformsRoot, 'svg.js')),
      [fileMatcher]: path.join(transformsRoot, 'file.js'),
    }),
    moduleNameMapper: {
      '\\.s?css$': path.join(transformsRoot, 'styles.js'),
    },
  };
}
