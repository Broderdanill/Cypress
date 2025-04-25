const { execSync } = require('child_process');
const fs = require('fs');

const output = 'cypress/results.json';
if (fs.existsSync(output)) fs.unlinkSync(output);

execSync('npx mochawesome-merge cypress/reports/*.json > cypress/results.json');
console.log('✅ Slutförde merge till results.json');
