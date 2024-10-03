import * as React from 'react';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const Home = () => {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={'Hello from Terezinha'} description={siteConfig.tagline}>
      <main className="flex flex-col items-center my-lg">
        <Heading as="h1">{siteConfig.title}</Heading>
        <Heading as="h2">{siteConfig.tagline}</Heading>
        <div className="">
          <img
            src="https://cdn.triangulos.tech/assets/terezinha_500x500_da67d70b65.webp"
            alt="Terezinha"
          />
        </div>
      </main>
    </Layout>
  );
};

export default Home;
