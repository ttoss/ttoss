import { compiler } from 'markdown-to-jsx';
import { renderToString } from 'react-dom/server';
import jsdoc from 'jsdoc-api';
import path from 'path';

export const getComment = ([pathFromDist, longname]) => {
  const res = jsdoc.explainSync({
    files: path.resolve(
      process.cwd(),
      '../../packages/carlin/dist',
      pathFromDist
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

export const toHtml = (comment) => {
  return renderToString(compiler(comment));
};

export const getComments = (commentsDir, { html } = { html: true }) => {
  return Object.entries(commentsDir).reduce((acc, [key, value]) => {
    const comment = getComment(value);
    return {
      ...acc,
      [key]: html ? toHtml(comment) : comment,
    };
  }, {});
};
