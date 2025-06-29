/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
module.exports = (context, options) => {
  return {
    name: 'tailwind-plugin',
    configurePostCss: (postcssOptions) => {
      postcssOptions.plugins = [require('@tailwindcss/postcss')];
      return postcssOptions;
    },
  };
};
