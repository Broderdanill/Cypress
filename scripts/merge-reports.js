const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const reportsDir = path.join(__dirname, '../cypress/reports');
const files = fs.readdirSync(reportsDir).filter(f =>
  f.endsWith('.json') &&
  !f.includes('merged') &&
  f.startsWith('mochawesome_')
);

// ✅ Filtrera ut trasiga JSON
const validFiles = files.filter(file => {
  try {
    const content = fs.readFileSync(path.join(reportsDir, file), 'utf-8');
    JSON.parse(content);
    return true;
  } catch (e) {
    console.warn(`⚠️  Hoppar över ogiltig rapport: ${file}`);
    return false;
  }
});

if (validFiles.length === 0) {
  console.error('❌ Inga giltiga rapporter att slå ihop.');
  process.exit(1);
}

// 🛠️ Slå ihop rapporterna
const mergeCmd = `npx mochawesome-merge ${validFiles.map(f => `cypress/reports/${f}`).join(' ')} > cypress/reports/merged.json`;
execSync(mergeCmd, { stdio: 'inherit' });

console.log('✅ Skapade merged.json');

// 🧹 Rensa upp gamla rapporter
validFiles.forEach(file => {
  const fullPath = path.join(reportsDir, file);
  fs.unlinkSync(fullPath);
  console.log(`🗑️  Tog bort ${file}`);
});
