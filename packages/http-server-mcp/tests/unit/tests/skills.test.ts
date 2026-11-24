import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { App, bodyParser } from '@ttoss/http-server';
import {
  createMcpRouter,
  McpServer,
  memorySkillFiles,
  nodeSkillFiles,
  SkillCatalog,
  SKILLS_EXTENSION_ID,
} from 'src/index';
import request from 'supertest';

const SKILL_MD = [
  '---',
  'name: campaign-builder',
  'description: Build a campaign with a validated structure.',
  '---',
  '',
  '# Campaign builder',
  '',
  'Read `references/structures.md`, then build the campaign.',
  '',
].join('\n');

const REFERENCE_MD = '# Structures\n\nCBO, ABO and creative testing.\n';

const SKILL_URI = 'skill://campaign-builder/SKILL.md';
const REFERENCE_URI = 'skill://campaign-builder/references/structures.md';

const sha256 = (text: string) => {
  return `sha256:${createHash('sha256').update(text).digest('hex')}`;
};

const loadCatalog = () => {
  return SkillCatalog.load(
    memorySkillFiles({
      'campaign-builder/SKILL.md': SKILL_MD,
      'campaign-builder/references/structures.md': REFERENCE_MD,
    })
  );
};

/** A builder that serves the catalog on every server it makes. */
const builderFor = (catalog: SkillCatalog) => {
  return () => {
    const server = new McpServer({ name: 'test-server', version: '1.0.0' });
    catalog.attach(server);
    return server;
  };
};

const mountBothEras = (build: () => McpServer) => {
  const app = new App();
  app.use(bodyParser());
  app.use(createMcpRouter(build(), { createMcpServer: build }).routes());
  return app.callback();
};

/** A 2025-era call — no per-request envelope. */
const legacy = (
  build: () => McpServer,
  method: string,
  params: Record<string, unknown> = {}
) => {
  return request(mountBothEras(build))
    .post('/mcp')
    .send({ jsonrpc: '2.0', id: 1, method, params })
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream');
};

/** A `2026-07-28` call, with its per-request envelope and routing headers. */
const modern = (
  build: () => McpServer,
  method: string,
  params: Record<string, unknown> = {}
) => {
  const name = params.uri as string | undefined;
  return request(mountBothEras(build))
    .post('/mcp')
    .send({
      jsonrpc: '2.0',
      id: 1,
      method,
      params: {
        ...params,
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
          'io.modelcontextprotocol/clientCapabilities': {
            extensions: { [SKILLS_EXTENSION_ID]: {} },
          },
        },
      },
    })
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream')
    .set({
      'Mcp-Method': method,
      'MCP-Protocol-Version': '2026-07-28',
      ...(name === undefined ? {} : { 'Mcp-Name': name }),
    });
};

const expectedEntry = {
  uri: SKILL_URI,
  frontmatter: {
    name: 'campaign-builder',
    description: 'Build a campaign with a validated structure.',
  },
  resources: [
    {
      uri: SKILL_URI,
      digest: sha256(SKILL_MD),
      size: Buffer.byteLength(SKILL_MD),
    },
    {
      uri: REFERENCE_URI,
      digest: sha256(REFERENCE_MD),
      size: Buffer.byteLength(REFERENCE_MD),
    },
  ],
};

describe.each([
  ['2025-era', legacy],
  ['2026-07-28', modern],
])('skills served through createMcpRouter (%s)', (_era, call) => {
  test('skills/list returns each skill with its full manifest', async () => {
    const build = builderFor(await loadCatalog());

    const response = await call(build, 'skills/list');

    expect(response.status).toBe(200);
    expect(response.body.result.skills).toEqual([expectedEntry]);
  });

  test('skills/get returns the entry for a SKILL.md URI', async () => {
    const build = builderFor(await loadCatalog());

    const response = await call(build, 'skills/get', { uri: SKILL_URI });

    expect(response.status).toBe(200);
    expect(response.body.result.skill).toEqual(expectedEntry);
  });

  test('skills/get answers -32602 for an unknown skill', async () => {
    const build = builderFor(await loadCatalog());

    const response = await call(build, 'skills/get', {
      uri: 'skill://unknown/SKILL.md',
    });

    expect(response.body.error.code).toBe(-32602);
  });

  test('resources/read serves the bytes the manifest describes', async () => {
    const build = builderFor(await loadCatalog());

    const skill = await call(build, 'resources/read', { uri: SKILL_URI });
    const reference = await call(build, 'resources/read', {
      uri: REFERENCE_URI,
    });

    expect(skill.body.result.contents[0].text).toBe(SKILL_MD);
    expect(reference.body.result.contents[0].text).toBe(REFERENCE_MD);
  });
});

describe('nodeSkillFiles', () => {
  test('serves the skills of a directory on disk', async () => {
    const root = await mkdtemp(join(tmpdir(), 'skills-'));
    await mkdir(join(root, 'campaign-builder/references'), { recursive: true });
    await writeFile(join(root, 'campaign-builder/SKILL.md'), SKILL_MD);
    await writeFile(
      join(root, 'campaign-builder/references/structures.md'),
      REFERENCE_MD
    );
    const build = builderFor(await SkillCatalog.load(nodeSkillFiles(root)));

    const response = await legacy(build, 'skills/list');

    expect(response.body.result.skills).toEqual([expectedEntry]);
  });
});

describe('skills extension declaration', () => {
  test('initialize advertises the extension to 2025-era clients', async () => {
    const build = builderFor(await loadCatalog());

    const response = await legacy(build, 'initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    });

    expect(response.body.result.capabilities.resources).toBeDefined();
    expect(
      response.body.result.capabilities.extensions[SKILLS_EXTENSION_ID]
    ).toBeDefined();
  });

  test('server/discover advertises the extension on 2026-07-28', async () => {
    const build = builderFor(await loadCatalog());

    const response = await modern(build, 'server/discover');

    expect(response.body.result.capabilities.resources).toBeDefined();
    expect(
      response.body.result.capabilities.extensions[SKILLS_EXTENSION_ID]
    ).toBeDefined();
  });
});
