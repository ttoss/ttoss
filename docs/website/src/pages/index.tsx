import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  link: string;
}

const FeatureCard = ({ title, description, icon, link }: FeatureCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
      <Link
        to={link}
        className="inline-flex items-center text-[var(--ifm-color-primary)] hover:text-[var(--ifm-color-primary-dark)] dark:text-[var(--ifm-color-primary)] dark:hover:text-[var(--ifm-color-primary-light)] font-medium"
      >
        Learn more →
      </Link>
    </div>
  );
};

interface StatCardProps {
  number: string;
  label: string;
}

const StatCard = ({ number, label }: StatCardProps) => {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-[var(--ifm-color-primary)] dark:text-[var(--ifm-color-primary)]">
        {number}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
};

const Home = () => {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={'Terezinha Tech Operations'}
      description={siteConfig.tagline}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between max-w-6xl mx-auto">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <Heading
                as="h1"
                className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6"
              >
                Complete Tech Operations Ecosystem
              </Heading>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {siteConfig.tagline}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/docs/modules"
                  className="bg-[var(--ifm-color-primary)] hover:bg-[var(--ifm-color-primary-dark)] text-white px-8 py-3 rounded-lg font-semibold text-center transition-colors duration-200"
                >
                  Explore Modules
                </Link>
                <Link
                  to="/docs/product"
                  className="border border-[var(--ifm-color-primary)] text-[var(--ifm-color-primary)] hover:bg-[var(--ifm-color-primary)] hover:text-white px-8 py-3 rounded-lg font-semibold text-center transition-colors duration-200"
                >
                  View Documentation
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <img
                src="img/terezinha_500x500.webp"
                alt="Terezinha - ttoss mascot"
                className="max-w-xs lg:max-w-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <StatCard number="30+" label="Reusable Modules" />
            <StatCard number="3" label="Core Pillars" />
            <StatCard number="100%" label="TypeScript" />
            <StatCard number="AWS" label="Cloud Ready" />
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Heading
              as="h2"
              className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Three Pillars of ttoss
            </Heading>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              A complete ecosystem designed to accelerate product development
              with modular solutions, structured processes, and powerful
              automation tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon="📚"
              title="Modular Library"
              description="30+ reusable NPM packages working in harmony. From GraphQL APIs to React components, authentication to internationalization - build faster with battle-tested modules."
              link="/docs/modules"
            />
            <FeatureCard
              icon="🏗️"
              title="Operational Processes"
              description="Structured workflows for Product, Engineering, and Design teams. Documented best practices that enable cross-functional collaboration and agile development."
              link="/docs/product"
            />
            <FeatureCard
              icon="🛠️"
              title="Carlin CLI Automation"
              description="Powerful command-line interface for automated AWS deployments, infrastructure management, and DevOps operations. Deploy with confidence using simple commands."
              link="/docs/carlin"
            />
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Heading
              as="h2"
              className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Built for Agility
            </Heading>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              ttoss implements agile principles at the core, enabling teams to
              pivot quickly and focus on customer value.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🚀 Accelerate Time-to-Market
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Eliminate &quot;reinventing the wheel&quot; with ready-to-use
                  modules
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Reduce technical complexity through opinionated solutions
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Focus on features that generate customer value
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                ⚡ Enable True Agility
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Short turning radius</strong> - pivot quickly when
                  needed
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Reduce project &quot;mass&quot; for maximum flexibility
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Maintain quality while adapting to change
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Heading
              as="h2"
              className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Modern Technology Stack
            </Heading>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Built with cutting-edge technologies for scalability and developer
              experience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
            {[
              'React',
              'TypeScript',
              'GraphQL',
              'AWS',
              'Node.js',
              'Tailwind',
            ].map((tech) => {
              return (
                <div
                  key={tech}
                  className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center shadow-md"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {tech}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--ifm-color-primary)] dark:bg-[var(--ifm-color-primary-dark)]">
        <div className="container mx-auto px-4 text-center">
          <Heading
            as="h2"
            className="text-3xl lg:text-4xl font-bold text-white mb-6"
          >
            Ready to Transform Your Development Process?
          </Heading>
          <p className="text-xl text-orange-100 dark:text-yellow-100 mb-8 max-w-2xl mx-auto">
            Join teams already using ttoss to build better products faster.
            Start with our modules or explore our comprehensive documentation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/docs/modules"
              className="bg-white text-[var(--ifm-color-primary)] hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Get Started with Modules
            </Link>
            <Link
              to="/docs/engineering"
              className="border border-white text-white hover:bg-white hover:text-[var(--ifm-color-primary)] px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              View Engineering Docs
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
