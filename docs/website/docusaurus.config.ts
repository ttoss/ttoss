import { themes as prismThemes } from 'prism-react-renderer';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import tailwindPlugin from './plugins/tailwind-config.cjs';
import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types'; // add this

// eslint-disable-next-line turbo/no-undeclared-env-vars
const environment = process.env.NODE_ENV;

const isDevelopment = environment === 'development';

const config: Config = {
  title: 'Terezinha Tech Operations (ttoss)',
  tagline:
    'Trust Terezinha to Simplify and Enhance Your Product Development Process',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://ttoss.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ttoss', // Usually your GitHub org/user name.
  projectName: 'ttoss', // Usually your repo name.

  onBrokenAnchors: 'throw',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    tailwindPlugin,
    './plugins/carlin/index.mjs',
    /**
     * Only include these plugins in production. We remove them in development
     * to speed up the build.
     */
    ...(isDevelopment
      ? []
      : [
          'appsync-api',
          'auth-core',
          'aws-appsync-nodejs',
          'cloud-auth',
          'cloud-vpc',
          'components',
          'config',
          'forms',
          'google-maps',
          'graphql-api',
          'graphql-api-server',
          'http-server',
          'i18n-cli',
          'ids',
          'layouts',
          'logger',
          'monorepo',
          'postgresdb',
          'postgresdb-cli',
          'react-auth',
          'react-feature-flags',
          'react-hooks',
          'react-i18n',
          'react-icons',
          'react-notifications',
          'read-config-file',
          'test-utils',
          'theme',
          'ui',
        ].map((pkg) => {
          /**
           * https://typedoc-plugin-markdown.org/plugins/docusaurus/quick-start#add-the-plugin-to-docusaurusconfigjs
           */
          return [
            'docusaurus-plugin-typedoc',
            {
              id: pkg,
              entryPoints: [`../../packages/${pkg}/src/index.ts`],
              tsconfig: `../../packages/${pkg}/tsconfig.json`,
              out: `./docs/modules/packages/${pkg}`,
              sidebar: {
                categoryLabel: `@ttoss/${pkg}`,
              },
              excludeExternals: true,
              excludeNotDocumented: true,
              excludeNotDocumentedKinds: ['Namespace'],
              skipErrorChecking: true,
            },
          ];
        })),
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/ttoss/ttoss/tree/main/docs/website/',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/ttoss/ttoss/tree/main/docs/website/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],

  themeConfig: {
    image:
      'https://cdn.triangulos.tech/assets/terezinha_1200x1200_with_space_bg_white_e107229d26.png',
    navbar: {
      title: 'ttoss',
      logo: {
        alt: 'Terezinha',
        src: 'https://cdn.triangulos.tech/assets/terezinha_100x100_af9272c980.webp',
      },
      items: [
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'product',
          label: 'Product',
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'design',
          label: 'Design',
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'engineering',
          label: 'Engineering',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'right',
        },
        {
          type: 'docSidebar',
          position: 'right',
          sidebarId: 'challenge',
          label: 'Challenge',
        },
        {
          type: 'docSidebar',
          position: 'right',
          sidebarId: 'carlin',
          label: 'Carlin',
        },
        {
          type: 'docSidebar',
          position: 'right',
          sidebarId: 'modules',
          label: 'Modules',
        },
        {
          href: 'https://storybook.ttoss.dev/',
          position: 'right',
          label: 'Storybook',
        },
        {
          href: 'https://github.com/ttoss/ttoss',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Areas',
          items: [
            {
              label: 'Product',
              to: '/docs/product',
            },
            {
              label: 'Design',
              to: '/docs/design',
            },
            {
              label: 'Engineering',
              to: '/docs/engineering',
            },
          ],
        },
        // {
        //   title: 'Community',
        //   items: [
        //     {
        //       label: 'Stack Overflow',
        //       href: 'https://stackoverflow.com/questions/tagged/docusaurus',
        //     },
        //     {
        //       label: 'Discord',
        //       href: 'https://discordapp.com/invite/docusaurus',
        //     },
        //     {
        //       label: 'Twitter',
        //       href: 'https://twitter.com/docusaurus',
        //     },
        //   ],
        // },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'Challenge',
              to: '/docs/challenge/the-project',
            },
            {
              label: 'Carlin',
              to: '/docs/carlin',
            },
            {
              label: 'Modules',
              to: '/docs/modules',
            },
            {
              label: 'Storybook',
              href: 'https://storybook.ttoss.dev/',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/ttoss/ttoss',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Terezinha Tech Operations (ttoss). Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

// eslint-disable-next-line import/no-default-export
export default config;
