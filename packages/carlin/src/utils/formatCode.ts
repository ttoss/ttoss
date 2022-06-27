import * as UglifyJS from 'uglify-js';
import * as prettier from 'prettier';

export const formatCode = (code: string) => {
  return prettier.format(code, { parser: 'babel' });
};

export const uglify = (code: string) => UglifyJS.minify(code).code;
