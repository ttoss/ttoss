import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';

import styles from './index.module.css';

interface BentoCardProps {
  title: string;
  description: string;
  icon: string;
  link: string;
  size: 'large' | 'small';
}

const BentoCard = ({
  title,
  description,
  icon,
  link,
  size,
}: BentoCardProps) => {
  return (
    <div
      className={`${styles.bentoCard} ${size === 'large' ? styles.bentoCardLarge : styles.bentoCardSmall}`}
    >
      <span className={styles.bentoCardIcon}>{icon}</span>
      <h3 className={styles.bentoCardTitle}>{title}</h3>
      <p className={styles.bentoCardDescription}>{description}</p>
      <Link to={link} className={styles.bentoCardLink}>
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
    <div className={styles.statCard}>
      <div className={styles.statNumber}>{number}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
};

interface StakeholderCardProps {
  icon: string;
  title: string;
  items: string[];
}

const StakeholderCard = ({ icon, title, items }: StakeholderCardProps) => {
  return (
    <div className={styles.stakeholderCard}>
      <div className={styles.stakeholderIcon}>{icon}</div>
      <h3 className={styles.stakeholderTitle}>{title}</h3>
      <ul className={styles.stakeholderList}>
        {items.map((item, index) => {
          return (
            <li key={index} className={styles.stakeholderListItem}>
              <span className={styles.stakeholderListIcon}>✓</span>
              {item}
            </li>
          );
        })}
      </ul>
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
      <section className={styles.heroSection}>
        <div className={styles.containerCustom}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeDot} />
                AI-Native Development Platform
              </div>
              <Heading as="h1" className={styles.heroTitle}>
                Build Products Faster with{' '}
                <span className={styles.heroTitleGradient}>
                  AI-Augmented Teams
                </span>
              </Heading>
              <p className={styles.heroDescription}>
                Modular libraries, agentic development principles, and
                battle-tested infrastructure for teams that ship. Configure
                once, integrate everywhere.
              </p>
              <div className={styles.heroButtons}>
                <Link to="/docs/ai" className={styles.heroButtonPrimary}>
                  Start with AI →
                </Link>
                <Link to="/docs/modules" className={styles.heroButtonSecondary}>
                  Explore Modules
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
      <section className={styles.statsSection}>
        <div className={styles.containerCustom}>
          <div className={styles.statsContainer}>
            <StatCard number="30+" label="Production Modules" />
            <StatCard number="5" label="Core Pillars" />
            <StatCard number="AI-Native" label="Workflows" />
            <StatCard number="100%" label="TypeScript" />
          </div>
        </div>
      </section>

      {/* Bento Grid Section - Five Pillars */}
      <section className={styles.bentoSection}>
        <div className={styles.containerCustom}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Platform</span>
            <Heading as="h2" className={styles.sectionTitle}>
              Five Pillars of ttoss
            </Heading>
            <p className={styles.sectionDescription}>
              A complete ecosystem for AI-augmented product development—from
              principles to production.
            </p>
          </div>

          <div className={styles.bentoGrid}>
            <BentoCard
              icon="🤖"
              title="AI & Agentic Development"
              description="Principles and patterns for human-AI collaboration. Scale development velocity with agentic workflows while maintaining quality through structural guardrails."
              link="/docs/ai"
              size="large"
            />
            <BentoCard
              icon="📚"
              title="Modular Library"
              description="30+ production-ready NPM packages. GraphQL APIs, React components, auth, i18n—everything you need."
              link="/docs/modules"
              size="large"
            />
            <BentoCard
              icon="🎨"
              title="Design System"
              description="Design tokens, themes, and accessible UI components for consistent interfaces."
              link="/docs/design"
              size="small"
            />
            <BentoCard
              icon="🏗️"
              title="Operational Processes"
              description="Structured workflows for Product, Engineering, and Design teams."
              link="/docs/product"
              size="small"
            />
            <BentoCard
              icon="🛠️"
              title="Carlin CLI"
              description="Automated AWS deployments and infrastructure management."
              link="/docs/carlin"
              size="small"
            />
          </div>
        </div>
      </section>

      {/* AI Principles Section */}
      <section className={styles.principlesSection}>
        <div className={styles.containerCustom}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Human-AI Collaboration</span>
            <Heading as="h2" className={styles.sectionTitle}>
              Agentic Development, Done Right
            </Heading>
            <p className={styles.sectionDescription}>
              AI amplifies velocity, humans provide judgment. We define the
              principles and patterns that make this partnership work in
              production.
            </p>
          </div>

          <div className={styles.principlesGrid}>
            <div className={styles.principleCard}>
              <div className={styles.principleCardHeader}>
                <span className={styles.principleCardIcon}>🧠</span>
                <h3 className={styles.principleCardTitle}>
                  Agentic Development Principles
                </h3>
              </div>
              <p className={styles.principleCardDescription}>
                AI agents are probabilistic, not deterministic. Our principles
                help you design workflows that work with the grain of the
                technology.
              </p>
              <ul className={styles.principleList}>
                <li className={styles.principleListItem}>
                  <span className={styles.principleListIcon}>✓</span>
                  <span className={styles.principleListText}>
                    <strong>Structural Determinism:</strong> Enforce constraints
                    via schemas, not prompts
                  </span>
                </li>
                <li className={styles.principleListItem}>
                  <span className={styles.principleListIcon}>✓</span>
                  <span className={styles.principleListText}>
                    <strong>Context Economics:</strong> Treat every token as a
                    scarce resource
                  </span>
                </li>
                <li className={styles.principleListItem}>
                  <span className={styles.principleListIcon}>✓</span>
                  <span className={styles.principleListText}>
                    <strong>Delegated Agency:</strong> Scale autonomy with
                    verification capability
                  </span>
                </li>
              </ul>
              <Link
                to="/docs/ai/agentic-development-principles"
                className={styles.principleCardLink}
              >
                Explore Principles →
              </Link>
            </div>

            <div className={styles.principleCard}>
              <div className={styles.principleCardHeader}>
                <span className={styles.principleCardIcon}>⚙️</span>
                <h3 className={styles.principleCardTitle}>
                  Production-Ready Patterns
                </h3>
              </div>
              <p className={styles.principleCardDescription}>
                Reusable design patterns that solve cost, latency, reliability,
                and risk challenges in every agentic system.
              </p>
              <ul className={styles.principleList}>
                <li className={styles.principleListItem}>
                  <span className={styles.principleListIcon}>✓</span>
                  <span className={styles.principleListText}>
                    <strong>Immediate Feedback Loops:</strong> AI integrated
                    directly into dev flow
                  </span>
                </li>
                <li className={styles.principleListItem}>
                  <span className={styles.principleListIcon}>✓</span>
                  <span className={styles.principleListText}>
                    <strong>Artificial Friction:</strong> Guardrails that
                    prevent entropy accumulation
                  </span>
                </li>
                <li className={styles.principleListItem}>
                  <span className={styles.principleListIcon}>✓</span>
                  <span className={styles.principleListText}>
                    <strong>Chain of Thought:</strong> Decompose complex tasks
                    for reliable output
                  </span>
                </li>
              </ul>
              <Link
                to="/docs/ai/agentic-design-patterns"
                className={styles.principleCardLink}
              >
                View Patterns →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section className={styles.stakeholdersSection}>
        <div className={styles.containerCustom}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>For Your Team</span>
            <Heading as="h2" className={styles.sectionTitle}>
              Why Teams Choose ttoss
            </Heading>
            <p className={styles.sectionDescription}>
              From individual developers to investment-ready startups—ship
              faster without sacrificing quality.
            </p>
          </div>

          <div className={styles.grid4}>
            <StakeholderCard
              icon="👩‍💻"
              title="For Developers"
              items={[
                'Type-safe modules that just work together',
                'AI patterns that amplify your expertise',
                'Less boilerplate, more building',
              ]}
            />
            <StakeholderCard
              icon="📊"
              title="For Product Managers"
              items={[
                'Faster iteration with reusable infrastructure',
                'Documented workflows for cross-team alignment',
                'Predictable delivery with battle-tested patterns',
              ]}
            />
            <StakeholderCard
              icon="🎨"
              title="For Designers"
              items={[
                'Unified design system with tokens and themes',
                'Component library that matches your designs',
                'Design-to-code consistency out of the box',
              ]}
            />
            <StakeholderCard
              icon="💼"
              title="For Investors"
              items={[
                'Reduced technical risk with proven architecture',
                'Faster time-to-market means faster validation',
                'Scalable foundation for growth',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className={styles.techSection}>
        <div className={styles.containerCustom}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Technology</span>
            <Heading as="h2" className={styles.sectionTitle}>
              Modern, AI-Ready Stack
            </Heading>
            <p className={styles.sectionDescription}>
              Enterprise-grade technologies designed for AI-augmented
              development
            </p>
          </div>

          <div className={styles.techGrid}>
            {[
              'TypeScript',
              'React',
              'GraphQL',
              'AWS',
              'Node.js',
              'AI Agents',
            ].map((tech) => {
              return (
                <div key={tech} className={styles.techBadge}>
                  {tech}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.containerCustom}>
          <div className={styles.ctaContent}>
            <Heading as="h2" className={styles.ctaTitle}>
              Build Faster with AI-Augmented Development
            </Heading>
            <p className={styles.ctaDescription}>
              Explore our modular libraries, learn agentic development
              principles, and deploy with confidence using battle-tested
              infrastructure.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/docs/ai" className={styles.ctaButtonPrimary}>
                Start with AI →
              </Link>
              <Link to="/docs/modules" className={styles.ctaButtonSecondary}>
                Browse Modules
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
