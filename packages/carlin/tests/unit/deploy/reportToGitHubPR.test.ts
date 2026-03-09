jest.mock('glob', () => {
  return {
    glob: jest.fn(),
  };
});
jest.mock('node:fs', () => {
  return {
    promises: {
      readFile: jest.fn(),
    },
  };
});

import * as fs from 'node:fs';

import { faker } from '@ttoss/test-utils/faker';
import { glob } from 'glob';
import {
  buildMarkdownComment,
  createOrUpdateComment,
  type DeployFileContent,
  findExistingComment,
  getPrNumber,
  GITHUB_PR_COMMENT_MARKER,
  readAllDeployFiles,
  reportToGitHubPR,
} from 'src/deploy/reportToGitHubPR';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const makeDeployFile = (
  overrides?: Partial<DeployFileContent>
): DeployFileContent => {
  return {
    environment: 'PR-my-branch',
    outputs: {
      AppUrl: {
        OutputKey: 'AppUrl',
        OutputValue: `https://${faker.internet.domainName()}`,
      },
    },
    packageName: `@scope/${faker.lorem.word()}`,
    projectName: faker.lorem.word(),
    stackName: `My-Stack-${faker.lorem.word()}`,
    ...overrides,
  };
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// readAllDeployFiles
// ---------------------------------------------------------------------------

describe('readAllDeployFiles', () => {
  test('returns parsed deploy files, sorted by packageName', async () => {
    const fileA = makeDeployFile({ packageName: '@scope/zzz' });
    const fileB = makeDeployFile({ packageName: '@scope/aaa' });

    jest
      .mocked(glob)
      .mockResolvedValue([
        '/workspace/a/.carlin/A.json',
        '/workspace/b/.carlin/B.json',
      ]);

    (fs.promises.readFile as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify(fileA))
      .mockResolvedValueOnce(JSON.stringify(fileB));

    const result = await readAllDeployFiles();

    expect(result).toHaveLength(2);
    expect(result[0].packageName).toBe('@scope/aaa');
    expect(result[1].packageName).toBe('@scope/zzz');
  });

  test('ignores files that cannot be parsed', async () => {
    const valid = makeDeployFile();

    jest
      .mocked(glob)
      .mockResolvedValue(['/a/.carlin/valid.json', '/b/.carlin/broken.json']);

    (fs.promises.readFile as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify(valid))
      .mockResolvedValueOnce('not valid json {{{{');

    const result = await readAllDeployFiles();

    expect(result).toHaveLength(1);
    expect(result[0].packageName).toBe(valid.packageName);
  });

  test('ignores files missing required fields', async () => {
    jest.mocked(glob).mockResolvedValue(['/a/.carlin/incomplete.json']);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({ environment: 'Prod' })
    );

    const result = await readAllDeployFiles();

    expect(result).toHaveLength(0);
  });

  test('returns empty array when no files found', async () => {
    jest.mocked(glob).mockResolvedValue([]);

    const result = await readAllDeployFiles();

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildMarkdownComment
// ---------------------------------------------------------------------------

describe('buildMarkdownComment', () => {
  test('includes the marker for idempotent updates', () => {
    const comment = buildMarkdownComment([makeDeployFile()]);
    expect(comment).toContain(GITHUB_PR_COMMENT_MARKER);
  });

  test('returns "no outputs" message when deploys is empty', () => {
    const comment = buildMarkdownComment([]);
    expect(comment).toContain('No deploy outputs found');
  });

  test('renders a row for every output key across all deploys', () => {
    const deploy = makeDeployFile({
      outputs: {
        UrlA: { OutputKey: 'UrlA', OutputValue: 'https://a.example.com' },
        UrlB: { OutputKey: 'UrlB', OutputValue: 'https://b.example.com' },
      },
    });

    const comment = buildMarkdownComment([deploy]);

    expect(comment).toContain('UrlA');
    expect(comment).toContain('https://a.example.com');
    expect(comment).toContain('UrlB');
    expect(comment).toContain('https://b.example.com');
  });

  test('includes package name and stack name in each row', () => {
    const deploy = makeDeployFile({
      packageName: '@my/app',
      stackName: 'MyApp-PR-42',
    });

    const comment = buildMarkdownComment([deploy]);

    expect(comment).toContain('@my/app');
    expect(comment).toContain('MyApp-PR-42');
  });
});

// ---------------------------------------------------------------------------
// getPrNumber
// ---------------------------------------------------------------------------

describe('getPrNumber', () => {
  const token = faker.string.uuid();
  const repo = 'owner/repo';
  const branch = 'feature/my-feature';

  test('returns the PR number for the first open PR on the branch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => {
        return [{ number: 42 }, { number: 99 }];
      },
    });

    const result = await getPrNumber({ branch, repo, token });

    expect(result).toBe(42);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`head=owner:${branch}`),
      expect.anything()
    );
  });

  test('throws when no open PR is found for the branch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => {
        return [];
      },
    });

    await expect(getPrNumber({ branch, repo, token })).rejects.toThrow(
      /No open PR found/
    );
  });

  test('throws when GitHub API returns a non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    await expect(getPrNumber({ branch, repo, token })).rejects.toThrow(
      /GitHub API error/
    );
  });
});

// ---------------------------------------------------------------------------
// findExistingComment
// ---------------------------------------------------------------------------

describe('findExistingComment', () => {
  const token = faker.string.uuid();
  const repo = 'owner/repo';
  const prNumber = faker.number.int({ min: 1, max: 999 });

  test('returns the comment that contains the marker', async () => {
    const markedComment = {
      id: 1,
      body: `${GITHUB_PR_COMMENT_MARKER}\n\n## Deploy Outputs`,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => {
        return [{ id: 2, body: 'Some unrelated comment' }, markedComment];
      },
    });

    const result = await findExistingComment({ prNumber, repo, token });

    expect(result).toEqual(markedComment);
  });

  test('returns undefined when no marked comment exists', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => {
        return [{ id: 1, body: 'unrelated' }];
      },
    });

    const result = await findExistingComment({ prNumber, repo, token });

    expect(result).toBeUndefined();
  });

  test('throws when GitHub API returns a non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      findExistingComment({ prNumber, repo, token })
    ).rejects.toThrow(/GitHub API error/);
  });
});

// ---------------------------------------------------------------------------
// createOrUpdateComment
// ---------------------------------------------------------------------------

describe('createOrUpdateComment', () => {
  const token = faker.string.uuid();
  const repo = 'owner/repo';
  const prNumber = faker.number.int({ min: 1, max: 999 });
  const body = `${GITHUB_PR_COMMENT_MARKER}\n\n## Deploy Outputs\n\nsome content`;

  test('POSTs to the issue comments endpoint when no existing comment', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => {
        return {};
      },
    });

    await createOrUpdateComment({ body, prNumber, repo, token });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(`/issues/${prNumber}/comments`);
    expect(options.method).toBe('POST');
  });

  test('PATCHes the existing comment when existingCommentId is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => {
        return {};
      },
    });

    const existingCommentId = faker.number.int({ min: 1000, max: 9999 });
    await createOrUpdateComment({
      body,
      existingCommentId,
      prNumber,
      repo,
      token,
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(`/comments/${existingCommentId}`);
    expect(options.method).toBe('PATCH');
  });

  test('throws when GitHub API returns a non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
    });

    await expect(
      createOrUpdateComment({ body, prNumber, repo, token })
    ).rejects.toThrow(/GitHub API error/);
  });
});

// ---------------------------------------------------------------------------
// reportToGitHubPR — integration
// ---------------------------------------------------------------------------

describe('reportToGitHubPR', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CARLIN_BRANCH: 'feature/my-feature',
      GH_TOKEN: faker.string.uuid(),
      GITHUB_REPOSITORY: 'owner/repo',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('creates a new comment when none exists', async () => {
    const deploy = makeDeployFile();
    jest.mocked(glob).mockResolvedValue(['/pkg/.carlin/Stack.json']);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(deploy)
    );

    // getPrNumber
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          return [{ number: 7 }];
        },
      })
      // findExistingComment
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          return [];
        },
      })
      // createOrUpdateComment (POST)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          return {};
        },
      });

    await reportToGitHubPR();

    const postCall = mockFetch.mock.calls[2];
    expect(postCall[1].method).toBe('POST');
    const sentBody = JSON.parse(postCall[1].body);
    expect(sentBody.body).toContain(GITHUB_PR_COMMENT_MARKER);
    expect(sentBody.body).toContain(deploy.packageName);
  });

  test('updates an existing comment', async () => {
    const deploy = makeDeployFile();
    jest.mocked(glob).mockResolvedValue(['/pkg/.carlin/Stack.json']);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(deploy)
    );

    const existingId = 555;

    // getPrNumber
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          return [{ number: 7 }];
        },
      })
      // findExistingComment — found
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          return [{ id: existingId, body: GITHUB_PR_COMMENT_MARKER }];
        },
      })
      // createOrUpdateComment (PATCH)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          return {};
        },
      });

    await reportToGitHubPR();

    const patchCall = mockFetch.mock.calls[2];
    expect(patchCall[0]).toContain(`/comments/${existingId}`);
    expect(patchCall[1].method).toBe('PATCH');
  });

  test('throws when GH_TOKEN is missing', async () => {
    delete process.env.GH_TOKEN;
    await expect(reportToGitHubPR()).rejects.toThrow(/GH_TOKEN/);
  });

  test('throws when GITHUB_REPOSITORY is missing', async () => {
    delete process.env.GITHUB_REPOSITORY;
    await expect(reportToGitHubPR()).rejects.toThrow(/GITHUB_REPOSITORY/);
  });

  test('throws when CARLIN_BRANCH is missing', async () => {
    delete process.env.CARLIN_BRANCH;
    await expect(reportToGitHubPR()).rejects.toThrow(/CARLIN_BRANCH/);
  });
});
