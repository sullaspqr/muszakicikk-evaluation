/**
 * evaluator.js
 * Main script for automatic evaluation of frontend and backend repositories.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import simpleGit from 'simple-git';
import { ESLint } from 'eslint';
import axios from 'axios';
import { runTests } from './test-runner.js'; // Placeholder for API/E2E tests
import { generateReport } from './report-generator.js';

// Determine __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load evaluation configuration
const configPath = path.join(__dirname, 'evaluation-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Define repositories to evaluate
const repos = [
  { name: 'frontend', url: 'https://github.com/sullaspqr/muszaki-cikkek-frontend.git' },
  { name: 'backend', url: 'https://github.com/sullaspqr/muszaki-cikkek-api.git' }
];

async function cloneRepos(baseDir) {
  const git = simpleGit();
  for (const repo of repos) {
    const targetPath = path.join(baseDir, repo.name);
    if (fs.existsSync(targetPath)) {
      console.log(`Repository '${repo.name}' already exists, pulling latest...`);
      await git.cwd(targetPath).pull();
    } else {
      console.log(`Cloning '${repo.name}'...`);
      await git.clone(repo.url, targetPath);
    }
  }
}

async function runLintChecks(baseDir) {
  const eslint = new ESLint({
    cwd: baseDir,
    useEslintrc: false,
    baseConfig: {
      env: { browser: true, es6: true, node: true },
      parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } },
      extends: ['eslint:recommended']
    }
  });
  const results = await eslint.lintFiles(['**/*.js', '**/*.jsx']);
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);
  console.log(resultText);
  // TODO: parse results and assign scores based on config.frontendCriteria
  return results;
}

async function evaluate() {
  const baseDir = path.resolve('./submissions');
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

  // 1. Clone or update repos
  await cloneRepos(baseDir);

  // 2. Lint checks for frontend
  console.log('Running ESLint on frontend...');
  const lintResults = await runLintChecks(path.join(baseDir, 'frontend'));

  // 3. API and E2E tests
  console.log('Running API and UI tests...');
  const testResults = await runTests(baseDir, config);

  // 4. Collect scores
  const scores = {
    lint: lintResults,
    tests: testResults
    // TODO: incorporate config-based scoring logic
  };

  // 5. Generate Excel report
  console.log('Generating report...');
  await generateReport(scores, config);

  console.log('Evaluation complete. Report generated.');
}

evaluate().catch(err => {
  console.error('Evaluation failed:', err);
  process.exit(1);
});