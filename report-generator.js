import ExcelJS from 'exceljs';
import path from 'path';

/**
 * generateReport
 * Generates an Excel report summarizing the scores based on the evaluation config.
 * @param {Object} scores - Object containing lint and test results
 * @param {Object} config - Evaluation configuration from evaluation-config.json
 */
export async function generateReport(scores, config) {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Értékelés');

  // Define columns
  sheet.columns = [
    { header: 'Tétel ID', key: 'id', width: 10 },
    { header: 'Feladat', key: 'task', width: 40 },
    { header: 'Max pont', key: 'max', width: 10 },
    { header: 'Elért pont', key: 'score', width: 10 }
  ];

  // Combine frontend and backend criteria
  const allCriteria = [
    ...config.frontendCriteria.map(c => ({ ...c, type: 'frontend' })),
    ...config.backendCriteria.map(c => ({ ...c, type: 'backend' }))
  ];

  // Placeholder scoring logic: assign full points if any test passes for that criterion
  for (const crit of allCriteria) {
    // Find matching test result
    const testResults = scores.tests?.api || [];
    const passedEntry = testResults.find(r => r.criterionId === crit.id);
    const earned = passedEntry && passedEntry.passed ? crit.maxPoints : 0;

    sheet.addRow({
      id: crit.id,
      task: crit.task,
      max: crit.maxPoints,
      score: earned
    });
  }

  // Save the workbook
  const outFile = path.resolve(process.cwd(), 'evaluation-report.xlsx');
  await workbook.xlsx.writeFile(outFile);
  console.log(`
Report generated: ${outFile}
`);
}