---
title: 'Maintaining a Monorepo: Strategies for Managing Dependencies and Updating Packages.'
description: This article offers strategies for managing a monorepo, including keeping dependencies up-to-date and using batch updates and automation to streamline fixes. The guidance provided can help ensure a well-organized and secure codebase.
authors:
  - arantespp
tags:
  - engineering
  - monorepo
  - automation
  - security
---

Maintaining a monorepo poses a significant challenge in the long term, particularly when it comes to keeping packages up-to-date. With a large number of packages in our monorepo in play (some is updated less frequently than others) and the fast-paced nature of the JavaScript ecosystem, some packages may be outdated easily. This can result in two major issues: firstly, the less frequently updated packages may contain outdated dependencies with known vulnerabilities, and secondly, updating these dependencies can prove to be a difficult task when we need to work on a package that relies on them.

To address these challenges, we have implemented a new workflow that enables us to update our packages incrementally and maintain the most recent versions of our dependencies. This approach is guided by the following principles:

- Whenever we update a package within our monorepo, we ensure that all of its dependencies are updated to the latest version.
- For any updated dependencies, we update all packages in the monorepo to use the same version of that dependency.

By adhering to these principles, we can effectively manage the dependencies of our packages and avoid any security vulnerabilities that may arise from outdated versions. Additionally, this workflow ensures that all packages are always up-to-date with the latest versions of their dependencies, reducing the likelihood of conflicts or other compatibility issues.

## How it works

Let's take the pull request (PR) [#210](https://github.com/ttoss/ttoss/pull/210) as example. On this PR, we fixed a bug on [@ttoss/forms](https://ttoss.dev/docs/modules/packages/forms/) package. After fixing the bug and writing the tests, we ran the following command to update the dependencies of the package:

```bash
npx npm-check-updates -u
```

After running this command, we saw that `jest`, `react-hook-form` and `yup` was updated to the latest version. We tested the package again and everything worked as expected.

Among the updated packages above, `jest` was the only that is used by other packages in the monorepo. So, we ran the following command on the monorepo root to update the other packages to use the same version of `jest`:

```bash
# Script for "check-dependency-version-consistency .",
# Check https://github.com/ttoss/ttoss/blob/main/package.json for more details
yarn cdvc --fix
```

The aforementioned command executes the [`check-dependency-version-consistency`](https://github.com/bmish/check-dependency-version-consistency) script, which is responsible for verifying the version consistency of dependencies across all packages in the monorepo. In the event of any inconsistencies, the script will update the affected packages to use the same version of the dependency. As an example, the script updated all packages to use the same version of `jest`, which you can review via [this link](https://github.com/ttoss/ttoss/pull/210/files). We subsequently ran tests across all packages, and everything functioned as intended.

## Batch Updates

This workflow is highly effective in updating breaking changes since we only need to perform the fix once for all packages within the monorepo. For example, if `jest` released a breaking change, we could fix it simultaneously across all packages, thereby reducing the time spent rectifying the changes on different days.

# Automation

To automate this workflow, we have incorporated a Git hook that runs the `check-dependency-version-consistency` script on the `pre-commit` hook. You can view the code for this hook [here](https://github.com/ttoss/ttoss/blob/main/.husky/pre-commit).

## Conclusion

In conclusion, maintaining a monorepo can be a complex undertaking, particularly with a large number of packages and dependencies in play. However, by following the principles outlined above, we can ensure that our packages remain up-to-date and free from security vulnerabilities. Moreover, the use of batch updates and automation can streamline the process of fixing breaking changes across all packages in the monorepo.

We hope that this article has provided you with some insight into how we manage our monorepo and keep our packages up-to-date.
