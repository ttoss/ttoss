/* eslint-disable no-console */
/* eslint-disable no-undef */
import minimist from 'minimist';

import { explain, getComment } from './getComments.mjs';

const args = minimist(process.argv.slice(2));

const pathFromBuild = args.path.replace('.ts', '.js');

if (!pathFromBuild) {
  console.log(
    'Please provide a path from carlin build folder to the file you want to print comments for'
  );
  process.exit(1);
}

(async () => {
  const longname = args.longname;

  let res = '';

  if (longname) {
    res = await getComment([pathFromBuild, longname]);
    res = res + '\n\n' + 'Copy comment code below to use in index.mjs:';
    res =
      res + '\n\n' + `${longname}Comment: ['${pathFromBuild}', '${longname}'],`;
  } else {
    res = await explain(pathFromBuild);

    const find = args.find;

    if (find) {
      res = res.filter((p) => {
        if (!p.description) {
          return false;
        }

        return p.description.toLowerCase().includes(find.toLowerCase());
      });
    }
  }

  console.log(res);
  process.exit(0);
})();
