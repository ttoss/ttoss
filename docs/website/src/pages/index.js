import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Logo from '../../static/img/docusaurus.png'

export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
    title={`Hello from ${siteConfig.title}`}
    description="Description will go into a meta tag in <head />"
  >
    <main>
      <div class="container text--center">
        <div class="row">
          <div class="col">
            <img class="featureImage_yA8i" alt="Powered by MDX" src="/img/undraw_typewriter.svg" loading="lazy" width="640" height="480"></img>
            <h3 class="featureHeading_TLGJ">Engineering Guide</h3>
          </div>
          <div class="col">
            <img class="featureImage_yA8i" alt="Built Using React" src="/img/undraw_react.svg" loading="lazy" width="640" height="480"></img>
            <h3 class="featureHeading_TLGJ">Modules</h3>
          </div>
          <div class="col">
            <img class="featureImage_yA8i" alt="Ready for Translations" src="/img/undraw_around_the_world.svg" loading="lazy" width="640" height="480"></img>
            <h3 class="featureHeading_TLGJ">Carlin</h3>
          </div>
        </div>
      </div>
    </main>
  </Layout>
  );
}
