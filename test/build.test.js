import { join } from 'path';
import execa from 'execa';

process.env.COMPRESS = 'none';
process.env.PROGRESS = 'none';
process.env.BABEL_POLYFILL = 'none';
process.env.__FROM_UMI_TEST = true;
process.env.UMI_TEST = true;

function build({ cwd }) {
  process.env.APP_ROOT = cwd;
  return execa(require.resolve('umi/bin/umi'), ['build']);
}

describe('build', () => {
  require('test-build-result')({
    root: join(__dirname, './fixtures'),
    build({ cwd }) {
      return build({ cwd });
    },
  });
});
