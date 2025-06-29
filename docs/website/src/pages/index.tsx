import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';

import styles from './index.module.css';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  link: string;
}

const FeatureCard = ({ title, description, icon, link }: FeatureCardProps) => {
  return (
    <div className={styles.featureCard}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '0.75rem',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          marginBottom: '1rem',
          color: 'var(--ifm-color-content-secondary)',
        }}
      >
        {description}
      </p>
      <Link
        to={link}
        style={{
          color: 'var(--ifm-color-primary)',
          fontWeight: '500',
          textDecoration: 'none',
        }}
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
    <div className={styles.textCenter}>
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'var(--ifm-color-primary)',
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontSize: '0.875rem',
          color: 'var(--ifm-color-content-secondary)',
        }}
      >
        {label}
      </div>
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
      <section className={`${styles.py20} ${styles.heroSection}`}>
        <div className={styles.containerCustom}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <Heading as="h1" className={styles.heroTitle}>
                Terezinha Tech Operations (ttoss)
              </Heading>
              <p className={styles.heroDescription}>{siteConfig.tagline}</p>
              <div className={styles.heroButtons}>
                <Link
                  to="/docs/modules"
                  className="button button--primary button--lg"
                >
                  Explore Modules
                </Link>
                <Link
                  to="/docs/product"
                  className="button button--secondary button--outline button--lg"
                >
                  View Documentation
                </Link>
              </div>
            </div>
            <div>
              <img
                src="img/terezinha_500x500.webp"
                alt="Terezinha - ttoss"
                className={styles.heroImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.py20}>
        <div className={styles.containerCustom}>
          <div className={`${styles.statsContainer}`}>
            <StatCard number="30+" label="Reusable Modules" />
            <StatCard number="3" label="Core Pillars" />
            <StatCard number="100%" label="TypeScript" />
            <StatCard number="AWS" label="Cloud Ready" />
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section
        className={styles.py20}
        style={{
          backgroundColor: 'var(--ifm-color-emphasis-100)',
        }}
      >
        <div className={styles.containerCustom}>
          <div className={`${styles.textCenter} ${styles.mb8}`}>
            <Heading as="h2" className={styles.sectionTitle}>
              Three Pillars of ttoss
            </Heading>
            <p className={styles.sectionDescription}>
              A complete ecosystem designed to accelerate product development
              with modular solutions, structured processes, and powerful
              automation tools.
            </p>
          </div>

          <div className={styles.grid3}>
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
      <section className={styles.py20}>
        <div className={styles.containerCustom}>
          <div className={`${styles.textCenter} ${styles.mb8}`}>
            <Heading as="h2" className={styles.sectionTitle}>
              Built for Agility
            </Heading>
            <p className={styles.sectionDescription}>
              ttoss implements agile principles at the core, enabling teams to
              pivot quickly and focus on customer value.
            </p>
          </div>

          <div className={styles.benefitsGrid}>
            <div className={styles.benefitSection}>
              <h3>🚀 Accelerate Time-to-Market</h3>
              <ul className={styles.benefitList}>
                <li>
                  <span>✓</span>
                  Eliminate &quot;reinventing the wheel&quot; with ready-to-use
                  modules
                </li>
                <li>
                  <span>✓</span>
                  Reduce technical complexity through opinionated solutions
                </li>
                <li>
                  <span>✓</span>
                  Focus on features that generate customer value
                </li>
              </ul>
            </div>

            <div className={styles.benefitSection}>
              <h3>⚡ Enable True Agility</h3>
              <ul className={styles.benefitList}>
                <li>
                  <span>✓</span>
                  <strong>Short turning radius</strong> - pivot quickly when
                  needed
                </li>
                <li>
                  <span>✓</span>
                  Reduce project &quot;mass&quot; for maximum flexibility
                </li>
                <li>
                  <span>✓</span>
                  Maintain quality while adapting to change
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section
        className={styles.py20}
        style={{
          backgroundColor: 'var(--ifm-color-emphasis-100)',
        }}
      >
        <div className={styles.containerCustom}>
          <div className={`${styles.textCenter} ${styles.mb8}`}>
            <Heading as="h2" className={styles.sectionTitle}>
              Modern Technology Stack
            </Heading>
            <p className={styles.sectionDescription}>
              Built with cutting-edge technologies for scalability and developer
              experience
            </p>
          </div>

          <div className={styles.techGrid}>
            {['React', 'TypeScript', 'GraphQL', 'AWS', 'Node.js'].map(
              (tech) => {
                return (
                  <div key={tech} className={styles.techCard}>
                    {tech}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${styles.py20} ${styles.ctaSection}`}>
        <div className={styles.containerCustom}>
          <div className={styles.ctaContent}>
            <Heading as="h2" className={styles.ctaTitle}>
              Ready to Transform Your Development Process?
            </Heading>
            <p className={styles.ctaDescription}>
              Join teams already using ttoss to build better products faster.
              Start with our modules or explore our comprehensive documentation.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/docs/modules" className={styles.ctaButtonPrimary}>
                Get Started with Modules
              </Link>
              <Link
                to="/docs/engineering"
                className={styles.ctaButtonSecondary}
              >
                View Engineering Docs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
