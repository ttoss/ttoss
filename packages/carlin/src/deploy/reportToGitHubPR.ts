import * as fs from 'node:fs';
import * as path from 'node:path';

import { glob } from 'glob';
import log from 'npmlog';

import { LATEST_DEPLOY_OUTPUTS_FILENAME } from './config';

const logPrefix = 'report';

export const GITHUB_PR_COMMENT_MARKER = '<!-- carlin-deploy-outputs -->';

export interface DeployFileOutput {
  OutputKey: string;
  OutputValue: string;
  Description?: string;
  ExportName?: string;
}

export interface DeployFileContent {
  stackName: string;
  environment: string;
  projectName: string;
  packageName: string;
  outputs: Record<string, DeployFileOutput>;
}

export const readAllDeployFiles = async (): Promise<DeployFileContent[]> => {
  const files = await glob('**/.carlin/*.json', {
    absolute: true,
    ignore: [
      '**/node_modules/**',
      `**/.carlin/${LATEST_DEPLOY_OUTPUTS_FILENAME}`,
    ],
  });

  const results: DeployFileContent[] = [];

  for (const file of files) {
    try {
      const raw = await fs.promises.readFile(file, 'utf-8');
      const content: DeployFileContent = JSON.parse(raw);

      if (content.stackName && content.outputs) {
        results.push(content);
      }
    } catch {
      log.warn(logPrefix, `Could not read deploy file: ${path.basename(file)}`);
    }
  }

  return results.sort((a, b) => {
    return a.packageName.localeCompare(b.packageName);
  });
};

export const buildMarkdownComment = (deploys: DeployFileContent[]): string => {
  const header = `${GITHUB_PR_COMMENT_MARKER}\n\n## Deploy Outputs\n`;

  if (deploys.length === 0) {
    return `${header}\nNo deploy outputs found.`;
  }

  const rows = deploys.flatMap(({ packageName, stackName, outputs }) => {
    return Object.values(outputs).map(({ OutputKey, OutputValue }) => {
      return `| \`${packageName}\` | \`${stackName}\` | \`${OutputKey}\` | ${OutputValue} |`;
    });
  });

  const table = [
    '| Package | Stack | Output Key | Output Value |',
    '|---------|-------|------------|--------------|',
    ...rows,
  ].join('\n');

  return `${header}\n${table}`;
};

export const getPrNumber = async ({
  branch,
  repo,
  token,
}: {
  branch: string;
  repo: string;
  token: string;
}): Promise<number> => {
  const [owner] = repo.split('/');

  const response = await fetch(
    `https://api.github.com/repos/${repo}/pulls?head=${owner}:${branch}&state=open&per_page=1`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error fetching PR: ${response.status} ${response.statusText}`
    );
  }

  const prs = (await response.json()) as Array<{ number: number }>;

  if (prs.length === 0) {
    throw new Error(`No open PR found for branch: ${branch}`);
  }

  return prs[0].number;
};

export const findExistingComment = async ({
  prNumber,
  repo,
  token,
}: {
  prNumber: number;
  repo: string;
  token: string;
}): Promise<{ id: number; body: string } | undefined> => {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/issues/${prNumber}/comments?per_page=100`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error fetching comments: ${response.status} ${response.statusText}`
    );
  }

  const comments = (await response.json()) as Array<{
    id: number;
    body: string;
  }>;

  return comments.find(({ body }) => {
    return body.includes(GITHUB_PR_COMMENT_MARKER);
  });
};

export const createOrUpdateComment = async ({
  body,
  existingCommentId,
  prNumber,
  repo,
  token,
}: {
  body: string;
  existingCommentId?: number;
  prNumber: number;
  repo: string;
  token: string;
}): Promise<void> => {
  const url = existingCommentId
    ? `https://api.github.com/repos/${repo}/issues/comments/${existingCommentId}`
    : `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;

  const method = existingCommentId ? 'PATCH' : 'POST';

  const response = await fetch(url, {
    body: JSON.stringify({ body }),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    method,
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error ${method} comment: ${response.status} ${response.statusText}`
    );
  }
};

export const reportToGitHubPR = async () => {
  const token = process.env.GH_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const branch = process.env.CARLIN_BRANCH;

  if (!token) {
    throw new Error(
      'GH_TOKEN environment variable is required for --channel=github-pr'
    );
  }

  if (!repo) {
    throw new Error(
      'GITHUB_REPOSITORY environment variable is required for --channel=github-pr'
    );
  }

  if (!branch) {
    throw new Error(
      'CARLIN_BRANCH environment variable is required for --channel=github-pr'
    );
  }

  log.info(logPrefix, 'Reading deploy outputs from workspace...');
  const deploys = await readAllDeployFiles();
  log.info(logPrefix, `Found ${deploys.length} deploy file(s).`);

  const prNumber = await getPrNumber({ branch, repo, token });
  log.info(logPrefix, `Reporting to PR #${prNumber}...`);

  const body = buildMarkdownComment(deploys);

  const existingComment = await findExistingComment({ prNumber, repo, token });

  await createOrUpdateComment({
    body,
    existingCommentId: existingComment?.id,
    prNumber,
    repo,
    token,
  });

  log.info(
    logPrefix,
    existingComment ? 'PR comment updated.' : 'PR comment created.'
  );
};
