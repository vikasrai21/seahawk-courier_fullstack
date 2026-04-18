'use strict';

const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  const repoRoot = path.resolve(__dirname, '..');
  execSync('npm run auth:bootstrap-demo --prefix backend', {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
};
