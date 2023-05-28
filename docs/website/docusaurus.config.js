// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const path = require('path');

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ttoss',
  tagline: 'Dinosaurs are cool',
  url: 'https://ttoss.dev',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ttoss', // Usually your GitHub org/user name.
  projectName: 'ttoss', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    path.resolve(__dirname, 'lifecycle/carlin'),
    ...[
      'appsync-api',
      'aws-appsync-nodejs',
      'cloud-auth',
      'components',
      'config',
      'forms',
      'graphql-api',
      'graphql-api-server',
      'i18n-cli',
      'logger',
      'monorepo',
      'react-i18n',
      'react-notifications',
      'ui',
    ].map((package) => {
      return [
        'docusaurus-plugin-typedoc',
        {
          id: package,
          entryPoints: [`../../packages/${package}/src/index.ts`],
          tsconfig: `../../packages/${package}/tsconfig.json`,
          out: `modules/packages/${package}`,
          sidebar: {
            categoryLabel: `@ttoss/${package}`,
          },
          excludeExternals: true,
        },
      ];
    }),
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
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
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
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
                href: 'https://github.com/facebook/docusaurus',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
};

module.exports = config;
