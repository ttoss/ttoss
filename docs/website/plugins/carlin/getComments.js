import * as path from 'path';
import { compiler } from 'markdown-to-jsx';
import { renderToString } from 'react-dom/server';
import jsdoc from 'jsdoc-api';

export const toHTML = (comment) => {
  return renderToString(compiler(comment));
};

export const getComment = async ([pathFromBuild, longname]) => {
  const res = await jsdoc.explain({
    files: path.resolve(
      process.cwd(),
      '../../packages/carlin/build',
      pathFromBuild
    ),
  });

  // if (pathFromDist === 'deploy/cicd/lambdas/cicdApiV1.handler.js') {
  //   const printObj = res
  //     .map((r) => ({
  //       longname: r.longname,
  //       description: r.description,
  //     }))
  //     .filter((r) => r.description);

  //   // eslint-disable-next-line no-console
  //   console.log(printObj);

  //   // eslint-disable-next-line global-require
  //   // require('fs').writeFileSync(
  //   //   // eslint-disable-next-line global-require
  //   //   require('path').join(__dirname, 'tmp_comments'),
  //   //   JSON.stringify(
  //   //     res.map((r) => ({ longname: r.longname, description: r.description })),
  //   //     null,
  //   //     2,
  //   //   ),
  //   // );
  //   process.exit(0);
  // }

  const { description } = res.find((p) => {
    return p.longname === longname && p.undocumented !== true;
  }) || { description: '***DESCRIPTION NOT FOUND***' };

  return description;
};

export const getCommentsAsHTML = async (commentsDir) => {
  const allComments = await Promise.all(
    Object.entries(commentsDir).map(async ([key, value]) => {
      const comment = await getComment(value);
      return [key, toHTML(comment)];
    })
  );

  return Object.fromEntries(allComments);
};
