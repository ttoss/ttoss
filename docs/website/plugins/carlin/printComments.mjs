import { explain, getComment } from './getComments.mjs';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2));

const pathFromBuild = args.path;

if (!pathFromBuild) {
  // eslint-disable-next-line no-console
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

  // eslint-disable-next-line no-console
  console.log(res);
  process.exit(0);
})();
