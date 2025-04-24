const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const reportsDir = path.join(__dirname, '../cypress/reports');
const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json') && !f.includes('merged'));

const validFiles = files.filter(file => {
  try {
    const content = fs.readFileSync(path.join(reportsDir, file), 'utf-8');
    JSON.parse(content); // försöker parsa som JSON
    return true;
  } catch (e) {
    console.warn(`⚠️  Hoppar över ogiltig eller tom rapport: ${file}`);
    return false;
  }
});

if (validFiles.length === 0) {
  console.error('❌ Inga giltiga rapportfiler att slå ihop.');
  process.exit(1);
}

const mergeCmd = `npx mochawesome-merge ${validFiles.map(f => `cypress/reports/${f}`).join(' ')} > cypress/reports/merged.json`;
execSync(mergeCmd, { stdio: 'inherit' });
