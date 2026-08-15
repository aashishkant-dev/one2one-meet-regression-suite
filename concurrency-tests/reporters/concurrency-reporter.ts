import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface TestRecord {
  testCaseId: string;
  testName: string;
  status: string;
  actualResult: string;
  executedBy: string;
  comments: string;
  timestamp: string;
}

class ConcurrencyReporter implements Reporter {
  private results: TestRecord[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    const testMatch = test.title.match(/TC-C[CR]-(\d{3})/);
    const testCaseId = testMatch ? `TC-C${testMatch[0].substring(3)}` : test.title;

    let actualResult = '';
    let status = 'Not Tested';
    let comments = '';

    if (result.status === 'passed') {
      status = 'Pass';
      actualResult = 'Test executed successfully - no assertions failed';
    } else if (result.status === 'failed') {
      status = 'Fail';
      actualResult = 'Test assertions failed - see details below';
      if (result.error) {
        comments = result.error.message || result.error.toString();
      }
    } else if (result.status === 'skipped') {
      status = 'Not Tested';
      actualResult = 'Test was skipped';
    }

    this.results.push({
      testCaseId,
      testName: test.title,
      status,
      actualResult,
      executedBy: 'Claude Code - Playwright',
      comments,
      timestamp: new Date().toISOString(),
    });
  }

  onEnd(result: any) {
    const reportDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Generate CSV export
    const csvPath = path.join(reportDir, 'concurrency-test-results.csv');
    const csvContent = this.generateCSV(this.results);
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    // Generate Excel-compatible TSV
    const tsvPath = path.join(reportDir, 'concurrency-test-results.tsv');
    const tsvContent = this.generateTSV(this.results);
    fs.writeFileSync(tsvPath, tsvContent, 'utf-8');

    // Generate summary JSON
    const jsonPath = path.join(reportDir, 'concurrency-test-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2), 'utf-8');

    // Print summary
    console.log('\n========================================');
    console.log('CONCURRENCY TEST EXECUTION SUMMARY');
    console.log('========================================');
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${this.results.filter(r => r.status === 'Pass').length}`);
    console.log(`Failed: ${this.results.filter(r => r.status === 'Fail').length}`);
    console.log(`Not Tested: ${this.results.filter(r => r.status === 'Not Tested').length}`);
    console.log('\nResults saved to:');
    console.log(`  CSV: ${csvPath}`);
    console.log(`  TSV: ${tsvPath}`);
    console.log(`  JSON: ${jsonPath}`);
    console.log('========================================\n');
  }

  private generateCSV(results: TestRecord[]): string {
    const headers = ['Test Case ID', 'Test Name', 'Status', 'Actual Result', 'Executed By', 'Comments', 'Timestamp'];
    const rows = results.map(r => [
      r.testCaseId,
      `"${r.testName}"`,
      r.status,
      `"${r.actualResult.replace(/"/g, '""')}"`,
      r.executedBy,
      `"${r.comments.replace(/"/g, '""')}"`,
      r.timestamp,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generateTSV(results: TestRecord[]): string {
    const headers = ['Test Case ID', 'Status', 'Actual Result', 'Executed By', 'Comments'];
    const rows = results.map(r => [
      r.testCaseId,
      r.status,
      r.actualResult,
      r.executedBy,
      r.comments,
    ]);

    return [headers, ...rows].map(row => row.join('\t')).join('\n');
  }
}

export default ConcurrencyReporter;
