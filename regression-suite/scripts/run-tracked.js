#!/usr/bin/env node
/**
 * Runs the full Playwright suite, then diffs this run's per-TC-ID pass/fail against the
 * last recorded run and appends both a machine-readable history entry (regression-log/history.json)
 * and a human-readable line (REGRESSION_LOG.md) - so "what broke since last time" is a
 * `git log -p REGRESSION_LOG.md` away instead of something you have to reconstruct by hand.
 *
 * Usage: npm run test:tracked   (same flags as `playwright test` can be appended after --)
 */
const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LAST_RUN_JSON = path.join(ROOT, 'regression-log', 'last-run.json');
const HISTORY_JSON = path.join(ROOT, 'regression-log', 'history.json');
const HUMAN_LOG_MD = path.join(ROOT, 'REGRESSION_LOG.md');

function gitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    return 'no-git-history';
  }
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

/** Flattens Playwright's nested suite/spec JSON reporter tree into one row per TC-ID test. */
function extractResults(reportJson) {
  const rows = [];

  function walkSuite(suite, filePath) {
    const file = suite.file || filePath;
    for (const spec of suite.specs || []) {
      const tcMatch = spec.title.match(/TC-[A-Z0-9-]+/g) || ['UNTAGGED'];
      for (const test of spec.tests || []) {
        const lastResult = (test.results || [])[test.results.length - 1] || {};
        const moduleAnnotation = (test.annotations || []).find((a) => a.type === 'module');
        rows.push({
          tcIds: tcMatch,
          title: spec.title,
          file,
          module: moduleAnnotation ? moduleAnnotation.description : 'Unknown',
          status: lastResult.status || 'unknown',
        });
      }
    }
    for (const child of suite.suites || []) {
      walkSuite(child, file);
    }
  }

  for (const suite of reportJson.suites || []) {
    walkSuite(suite, suite.file);
  }
  return rows;
}

function summarize(rows) {
  const summary = { total: rows.length, passed: 0, failed: 0, skipped: 0, other: 0 };
  for (const r of rows) {
    if (r.status === 'passed') summary.passed++;
    else if (r.status === 'failed' || r.status === 'timedOut') summary.failed++;
    else if (r.status === 'skipped') summary.skipped++;
    else summary.other++;
  }
  return summary;
}

function diffRuns(previousRows, currentRows) {
  const prevByTitle = new Map(previousRows.map((r) => [r.title, r.status]));
  const newFailures = [];
  const newFixes = [];
  for (const cur of currentRows) {
    const prevStatus = prevByTitle.get(cur.title);
    const curFailed = cur.status === 'failed' || cur.status === 'timedOut';
    const prevFailed = prevStatus === 'failed' || prevStatus === 'timedOut';
    if (curFailed && !prevFailed && prevStatus !== undefined) {
      newFailures.push(cur);
    } else if (!curFailed && prevFailed) {
      newFixes.push(cur);
    }
  }
  return { newFailures, newFixes };
}

function main() {
  fs.mkdirSync(path.join(ROOT, 'regression-log'), { recursive: true });

  const passthroughArgs = process.argv.slice(2);
  const result = spawnSync('npx', ['playwright', 'test', ...passthroughArgs], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  const currentReport = loadJson(LAST_RUN_JSON, null);
  if (!currentReport) {
    console.error('\n[run-tracked] No JSON report found at regression-log/last-run.json - tracking skipped.');
    process.exit(result.status ?? 1);
  }

  const currentRows = extractResults(currentReport);
  const currentSummary = summarize(currentRows);

  const history = loadJson(HISTORY_JSON, { runs: [] });
  const previousRun = history.runs[history.runs.length - 1];
  const { newFailures, newFixes } = previousRun ? diffRuns(previousRun.rows, currentRows) : { newFailures: [], newFixes: [] };

  const entry = {
    timestamp: new Date().toISOString(),
    gitSha: gitSha(),
    summary: currentSummary,
    newFailures: newFailures.map((r) => ({ tcIds: r.tcIds, title: r.title, module: r.module })),
    newFixes: newFixes.map((r) => ({ tcIds: r.tcIds, title: r.title, module: r.module })),
    rows: currentRows,
  };
  history.runs.push(entry);
  fs.writeFileSync(HISTORY_JSON, JSON.stringify(history, null, 2));

  const lines = [];
  lines.push(`## ${entry.timestamp} — commit \`${entry.gitSha}\``);
  lines.push('');
  lines.push(`**${currentSummary.passed}/${currentSummary.total} passed**, ${currentSummary.failed} failed, ${currentSummary.skipped} skipped.`);
  if (newFailures.length) {
    lines.push('');
    lines.push('**NEW FAILURES since last tracked run:**');
    for (const f of newFailures) lines.push(`- ${f.tcIds.join(', ')} — ${f.title} (${f.module})`);
  }
  if (newFixes.length) {
    lines.push('');
    lines.push('**Newly passing (were failing last tracked run):**');
    for (const f of newFixes) lines.push(`- ${f.tcIds.join(', ')} — ${f.title} (${f.module})`);
  }
  if (!previousRun) {
    lines.push('');
    lines.push('_First tracked run - nothing to diff against yet._');
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  const existingMd = fs.existsSync(HUMAN_LOG_MD) ? fs.readFileSync(HUMAN_LOG_MD, 'utf8') : '# Regression Log\n\nMost recent run first. Generated by `npm run test:tracked` - do not hand-edit.\n\n---\n\n';
  const headerEnd = existingMd.indexOf('---\n\n') + '---\n\n'.length;
  const updatedMd = existingMd.slice(0, headerEnd) + lines.join('\n') + existingMd.slice(headerEnd);
  fs.writeFileSync(HUMAN_LOG_MD, updatedMd);

  console.log(`\n[run-tracked] ${currentSummary.passed}/${currentSummary.total} passed. ${newFailures.length} new failure(s), ${newFixes.length} newly fixed. Logged to REGRESSION_LOG.md.`);

  process.exit(result.status ?? 0);
}

module.exports = { extractResults, summarize, diffRuns };

if (require.main === module) {
  main();
}
