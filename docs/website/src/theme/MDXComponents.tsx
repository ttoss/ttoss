/**
 * https://docusaurus.io/docs/markdown-features/react#mdx-component-scope
 */
import MDXComponents from '@theme-original/MDXComponents';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Link = (props: any) => {
  const { siteConfig } = useDocusaurusContext();
  /**
   * Remove the site URL from the href attribute. Doing this, browser don't
   * open a new tab when the user clicks on a link.
   */
  const href = props.href.replace(siteConfig.url, '');
  return <MDXComponents.a {...props} href={href} />;
};

export default {
  ...MDXComponents,
  a: Link,
};
