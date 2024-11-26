import * as path from 'path';
import { compiler } from 'markdown-to-jsx';
import { renderToString } from 'react-dom/server';
import jsdoc from 'jsdoc-api';

export const toHTML = (comment) => {
  return renderToString(compiler(comment));
};

export const explain = async (pathFromBuild) => {
  const thisFileDir = path.dirname(new URL(import.meta.url).pathname);

  const res = await jsdoc.explain({
    files: path.resolve(
      thisFileDir,
      '../../', // This is the root of the website project.
      '../../', // This is the root of the monorepo.
      'packages/carlin/build', // This is the build directory of the carlin package.
      pathFromBuild
    ),
  });

  return res;
};

export const getComment = async ([pathFromBuild, longname]) => {
  const res = await explain(pathFromBuild);

  /**
   * We use `description` instead of `comment` because `comment` has the raw
   * comment, which includes the JSDoc tags and "/**" and "*" characters.
   */
  const { description } = res.find((p) => {
    return p.longname === longname && p.undocumented !== true;
  });

  if (!description) {
    throw new Error(
      `Comment not found for longname: ${longname} in ${pathFromBuild}`
    );
  }

  return description;
};

export const getCommentsAsHTML = async (commentsDir) => {
  const allCommentsAsHtml = {};

  for (const [key, value] of Object.entries(commentsDir)) {
    const comment = await getComment(value);
    allCommentsAsHtml[key] = toHTML(comment);
  }

  return allCommentsAsHtml;
};
