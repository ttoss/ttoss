import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePluginData } from '@docusaurus/useGlobalData';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import * as React from 'react';

import styles from './index.module.css';

const AGENT_INSTRUCTION =
  'Fetch and follow the instructions at\nhttps://ttoss.dev/ttoss-instructions.txt.';

const SCARCITIES = [
  {
    title: 'Knowing what to build',
    body: 'Small batches, fast feedback, and decisions priced in economic terms instead of opinions.',
    link: '/docs/product',
    linkLabel: 'Product development',
  },
  {
    title: 'Proving it is correct',
    body: 'Verification is the loop that makes generated code committable. Coverage never goes down.',
    link: '/docs/engineering/pillars/tests',
    linkLabel: 'Tests pillar',
  },
  {
    title: 'Undoing it when it is not',
    body: 'Atomic changes, feature flags, and migrations written with their rollback, so being wrong is survivable.',
    link: '/docs/ai/agentic-engineering-foundations/reversibility',
    linkLabel: 'Reversibility',
  },
];

const LAYERS = [
  {
    name: 'Principles',
    question:
      'What is true about working with agents, whether or not you act on it?',
    link: '/docs/ai/agentic-development-principles',
  },
  {
    name: 'Foundations',
    question: 'What must be true of a team before agentic execution pays off?',
    link: '/docs/ai/agentic-engineering-foundations',
  },
  {
    name: 'Pillars',
    question:
      'Which properties did we mechanize so they hold when attention does not?',
    link: '/docs/engineering/pillars',
  },
  {
    name: 'Guidelines & workflow',
    question: 'How exactly do we do it in this repository?',
    link: '/docs/engineering',
  },
  {
    name: 'Packages & Carlin',
    question: 'What can I install instead of writing it again?',
    link: '/docs/modules',
  },
];

const MECHANISMS = [
  {
    rule: 'Coverage thresholds live in every package’s Jest config and are only ever raised.',
    where: 'tests/unit/jest.config.ts',
  },
  {
    rule: 'Pull requests fail if lint would change a single file.',
    where: '.cicd/commands/pr.sh',
  },
  {
    rule: 'Dependency versions must match across the whole monorepo.',
    where: 'syncpack lint',
  },
  {
    rule: 'This site refuses to build with a broken link or anchor.',
    where: 'docusaurus.config.ts',
  },
];

const PACKAGE_GROUPS = [
  {
    area: 'Interface',
    packages: ['ui', 'fsl-ui', 'fsl-theme', 'forms', 'react-i18n'],
  },
  {
    area: 'Server',
    packages: ['http-server', 'graphql-api', 'postgresdb', 'http-server-mcp'],
  },
  {
    area: 'Cloud',
    packages: ['carlin', 'cloudformation', 'cloud-auth', 'cloud-vpc'],
  },
  {
    area: 'Tooling',
    packages: ['config', 'i18n-cli', 'monorepo', 'test-utils'],
  },
];

type PrinciplesGraphData = {
  nodes: { type: 'principle' | 'corollary' }[];
};

const usePrincipleCount = () => {
  const data = usePluginData('principles-graph-plugin') as
    PrinciplesGraphData | undefined;

  return (data?.nodes ?? []).filter((node) => {
    return node.type === 'principle';
  }).length;
};

const AgentInstruction = () => {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_INSTRUCTION.replace('\n', ' '));
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <figure className={styles.agentPanel}>
      <div className={styles.agentHeader}>
        <figcaption className={styles.agentCaption}>
          Brief your agent in one line
        </figcaption>
        <button
          type="button"
          className={styles.copyButton}
          onClick={copy}
          aria-live="polite"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className={styles.agentCode}>
        <code>{AGENT_INSTRUCTION}</code>
      </pre>
      <p className={styles.agentHint}>
        Paste it into Copilot, Cursor, Claude, or any agent’s instructions so it
        checks the ttoss packages before writing new code.{' '}
        <Link to="/docs/ai/agent-context">How it works</Link>
      </p>
    </figure>
  );
};

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Terezinha Tech Operations</p>
        <Heading as="h1" className={styles.heroTitle}>
          Code got cheap.
          <br />
          <span className={styles.heroTitleAccent}>Judgment didn’t.</span>
        </Heading>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.heroLead}>
              ttoss is how we build products with AI agents, written down and
              open-sourced: the principles we reason from, the guardrails that
              enforce them, and 50+ TypeScript packages your agents can reuse
              instead of reinventing.
            </p>
            <div className={styles.heroActions}>
              <Link to="/docs/ai" className={styles.buttonPrimary}>
                Read the principles
              </Link>
              <Link to="/docs/modules" className={styles.buttonSecondary}>
                Browse packages
              </Link>
            </div>
          </div>
          <AgentInstruction />
        </div>
      </div>
    </section>
  );
};

const ScarcitySection = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <Heading as="h2" className={styles.sectionTitle}>
          When generating code is cheap, three things stay scarce.
        </Heading>
        <ol className={styles.scarcityList}>
          {SCARCITIES.map((item, index) => {
            return (
              <li key={item.title} className={styles.scarcity}>
                <span className={styles.scarcityNumber} aria-hidden>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className={styles.scarcityTitle}>{item.title}</h3>
                <p className={styles.scarcityBody}>{item.body}</p>
                <Link to={item.link} className={styles.inlineLink}>
                  {item.linkLabel} →
                </Link>
              </li>
            );
          })}
        </ol>
        <p className={styles.sectionNote}>
          Every page on this site exists to make one of those three cheap enough
          to do at the speed agents produce change.
        </p>
      </div>
    </section>
  );
};

const LayersSection = () => {
  const principleCount = usePrincipleCount();

  return (
    <section className={`${styles.section} ${styles.sectionMuted}`}>
      <div className={`${styles.container} ${styles.split}`}>
        <div>
          <Heading as="h2" className={styles.sectionTitle}>
            From laws to code, one layer at a time.
          </Heading>
          <p className={styles.sectionLead}>
            Read top-down to understand why the practices look the way they do.
            Read bottom-up if you have a codebase to change on Monday.
          </p>
          {principleCount > 0 && (
            <p className={styles.sectionLead}>
              <Link to="/docs/ai/agentic-development-principles/graph">
                Explore all {principleCount} principles as a graph →
              </Link>
            </p>
          )}
        </div>
        <ol className={styles.layers}>
          {LAYERS.map((layer) => {
            return (
              <li key={layer.name} className={styles.layer}>
                <Link to={layer.link} className={styles.layerLink}>
                  <span className={styles.layerName}>{layer.name}</span>
                  <span className={styles.layerQuestion}>{layer.question}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

const MechanismsSection = () => {
  return (
    <section className={styles.section}>
      <div className={`${styles.container} ${styles.split}`}>
        <div>
          <Heading as="h2" className={styles.sectionTitle}>
            Enforced, not remembered.
          </Heading>
          <p className={styles.sectionLead}>
            An agent has no institutional memory. It complies with what is
            enforced and interpolates the rest. So every rule we care about is a
            check a machine runs — including on this repository.
          </p>
          <Link to="/docs/engineering/pillars" className={styles.inlineLink}>
            Engineering pillars →
          </Link>
        </div>
        <ul className={styles.mechanisms}>
          {MECHANISMS.map((mechanism) => {
            return (
              <li key={mechanism.rule} className={styles.mechanism}>
                <span className={styles.mechanismRule}>{mechanism.rule}</span>
                <code className={styles.mechanismWhere}>{mechanism.where}</code>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

const PackagesSection = () => {
  return (
    <section className={`${styles.section} ${styles.sectionMuted}`}>
      <div className={styles.container}>
        <Heading as="h2" className={styles.sectionTitle}>
          Configure once at the root. Every package adapts.
        </Heading>
        <p className={styles.sectionLead}>
          Theme, translations, and notifications come from providers, not props
          — so packages compose without prop drilling, and an agent has one
          convention to follow instead of fifty.
        </p>
        <div className={styles.packageGroups}>
          {PACKAGE_GROUPS.map((group) => {
            return (
              <div key={group.area} className={styles.packageGroup}>
                <h3 className={styles.packageArea}>{group.area}</h3>
                <ul className={styles.packageList}>
                  {group.packages.map((name) => {
                    return (
                      <li key={name}>
                        <Link
                          to={`/docs/modules/packages/${name}`}
                          className={styles.packageName}
                        >
                          @ttoss/{name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <div className={styles.heroActions}>
          <Link to="/docs/modules" className={styles.buttonSecondary}>
            See all packages
          </Link>
          <Link
            to="/docs/modules/integration-architecture"
            className={styles.inlineLink}
          >
            Integration architecture →
          </Link>
        </div>
      </div>
    </section>
  );
};

const ClosingSection = () => {
  return (
    <section className={styles.closing}>
      <div className={styles.container}>
        <Heading as="h2" className={styles.closingTitle}>
          Start with why the rules exist.
        </Heading>
        <div className={styles.heroActions}>
          <Link to="/docs/ai" className={styles.buttonPrimary}>
            Read the principles
          </Link>
          <Link
            href="https://github.com/ttoss/ttoss"
            className={styles.buttonSecondary}
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title="Terezinha Tech Operations" description={siteConfig.tagline}>
      <main>
        <HeroSection />
        <ScarcitySection />
        <LayersSection />
        <MechanismsSection />
        <PackagesSection />
        <ClosingSection />
      </main>
    </Layout>
  );
};

export default Home;
