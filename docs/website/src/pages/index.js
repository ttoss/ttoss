import Layout from '@theme/Layout';
import Logo from '../../static/img/docusaurus.png'
import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
    title={`Hello from ${siteConfig.title}`}
    description="Description will go into a meta tag in <head />"
  >
    <main>
      <div className="container text--center">
        <div className="row">
          <div className="col">
            <img className="featureImage_yA8i" alt="Powered by MDX" src="/img/undraw_typewriter.svg" loading="lazy" width="640" height="480"></img>
            <h3 className="featureHeading_TLGJ">Engineering Guide</h3>
          </div>
          <div className="col">
            <img className="featureImage_yA8i" alt="Built Using React" src="/img/undraw_react.svg" loading="lazy" width="640" height="480"></img>
            <h3 className="featureHeading_TLGJ">Modules</h3>
          </div>
          <div className="col">
            <img className="featureImage_yA8i" alt="Ready for Translations" src="/img/undraw_around_the_world.svg" loading="lazy" width="640" height="480"></img>
            <h3 className="featureHeading_TLGJ">Carlin</h3>
          </div>
        </div>
      </div>
    </main>
  </Layout>
  );
}
