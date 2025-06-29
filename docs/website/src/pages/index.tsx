import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';

const Home = () => {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={'Hello from Terezinha'} description={siteConfig.tagline}>
      <main className="flex flex-col items-center my-lg">
        <Heading as="h1">{siteConfig.title}</Heading>
        <Heading as="h2">{siteConfig.tagline}</Heading>
        <div className="">
          <img src="img/terezinha_500x500.webp" alt="Terezinha" />
        </div>
      </main>
    </Layout>
  );
};

export default Home;
