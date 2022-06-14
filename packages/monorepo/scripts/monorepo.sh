#!/usr/bin/env bash

rm .husky/pre-commit
npx husky add .husky/pre-commit "yarn lint-staged -c node_modules/@ttoss/monorepo/config/lintstagedrc.js"

yarn husky install
