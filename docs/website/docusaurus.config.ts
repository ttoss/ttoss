import { themes as prismThemes } from 'prism-react-renderer';
import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';

// eslint-disable-next-line turbo/no-undeclared-env-vars
const environment = process.env.NODE_ENV;

const isDevelopment = environment === 'development';

const config: Config = {
  title: 'ttoss',
  tagline: 'ttoss are cool',
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
    './plugins/carlin/index.mjs',
    /**
     * Only include these plugins in production. We remove them in development
     * to speed up the build.
     */
    ...(isDevelopment
      ? []
      : [
          'appsync-api',
          'aws-appsync-nodejs',
          'cloud-auth',
          'components',
          'config',
          'forms',
          'graphql-api',
          'graphql-api-server',
          'i18n-cli',
          'ids',
          'layouts',
          'logger',
          'monorepo',
          'react-feature-flags',
          'react-i18n',
          'react-icons',
          'react-notifications',
          'theme',
          'ui',
        ].map((pkg) => {
          /**
           * https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/docusaurus-plugin-typedoc#multi-instance
           */
          return [
            'docusaurus-plugin-typedoc',
            {
              id: pkg,
              entryPoints: [`../../packages/${pkg}/src/index.ts`],
              tsconfig: `../../packages/${pkg}/tsconfig.json`,
              out: `modules/packages/${pkg}`,
              sidebar: {
                categoryLabel: `@ttoss/${pkg}`,
              },
              excludeExternals: true,
              excludeNotDocumented: true,
              excludeNotDocumentedKinds: ['Namespace'],
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
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'ttoss',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
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
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'challenge',
          label: 'Challenge',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
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
        // {
        //   title: 'Engineering',
        //   items: [
        //     {
        //       label: 'Tutorial',
        //       to: '/engineering/intro',
        //     },
        //   ],
        // },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/docusaurus',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/docusaurus',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/ttoss/ttoss',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

// eslint-disable-next-line import/no-default-export
export default config;
