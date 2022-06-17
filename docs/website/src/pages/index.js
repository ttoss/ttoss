import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { Redirect } from '@docusaurus/router';


export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  return <Redirect to="docs/carlin/intro" />;
}
