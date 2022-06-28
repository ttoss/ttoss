import Layout from '@theme/Layout';
import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  // return <Redirect to="docs/carlin/intro" />;

  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <main>
        <div className="container text--center">
          <div className="row">
            <div className="col">
              <img src="/img/undraw_typewriter.svg" alt="image1"></img>
              <h3>Engineering Guide</h3>
            </div>
            <div className="col">
              <img src="/img/undraw_react.svg" alt="image2"></img>
              <h3 className="featureHeading_TLGJ">Modules</h3>
            </div>
            <div className="col">
              <img src="/img/undraw_around_the_world.svg" alt="image3"></img>
              <h3 className="featureHeading_TLGJ">Carlin</h3>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
