---
title: 22-08-24 - Monorepo
---

## Proposal

A project that we always had since the company's first day was to have a single repository for all projects. At that time, we couldn't implement it because of tooling and because we didn't have enough knowledge to keep and maintain it. Implementing this monorepo would be feasible today because we're in a remarkable development process.

### Pros

- We'll share knowledge. Everyone can see everyone else's PRs so we can learn much faster.
- We were able to see all the company's work.
- Reviewing PRs and giving feedback is easier because we need to track only one repository.
- We can implement some ClickUp automation.

### Cons

- Increases the complexity of CICD, but with the tooling we have, this is not much more critical.

### FAQ

#### Should each developer review every PR?

No. Depending on the frequency in which the team creates PRs, it becomes difficult to review all PRs.

#### If the monorepo has 100 projects, should every developer know about the 100 projects?

No. Developers can understand each project, but it's not mandatory.
