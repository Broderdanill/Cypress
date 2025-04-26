const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// 📦 Hämta miljövariabler
const {
  HELIX_URL,
  HELIX_USER,
  HELIX_PASS,
  HELIX_FORM
} = process.env;

// 🔍 Kontrollera att allt viktigt finns
if (!HELIX_URL || !HELIX_USER || !HELIX_PASS || !HELIX_FORM) {
  console.error('❌ Saknade miljövariabler: HELIX_URL, HELIX_USER, HELIX_PASS, HELIX_FORM');
  process.exit(1);
}

async function loginHelix() {
  try {
    const response = await axios.post(`${HELIX_URL}/api/jwt/login`, null, {
      params: {
        username: HELIX_USER,
        password: HELIX_PASS
      }
    });
    console.log('✅ Lyckades logga in till Helix.');
    return response.data; // JWT-token
  } catch (err) {
    console.error('❌ Misslyckades logga in till Helix:', err.response?.data || err.message);
    throw err;
  }
}

async function sendTestResults(token, testData) {
  try {
    const response = await axios.post(`${HELIX_URL}/api/arsys/v1/entry/${HELIX_FORM}`, testData, {
      headers: {
        Authorization: `AR-JWT ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Resultat skickat till Helix! ID: ${response.data.entryId}`);
  } catch (err) {
    console.error('❌ Fel vid POST till Helix:', err.response?.data || err.message);
    throw err;
  }
}

async function main() {
  const resultsPath = path.join(__dirname, '../cypress/results.json');
  const reportsDir = path.join(__dirname, '../cypress/reports');

  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ Filen ${resultsPath} finns inte. Har Cypress körts?`);
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  const runTime = new Date(results.stats?.end || Date.now()).toISOString();

  try {
    const token = await loginHelix();
    let count = 0;

    for (const result of results.results || []) {
      const file = result.file || 'okänd';

      for (const suite of result.suites || []) {
        for (const test of suite.tests || []) {
          const payload = {
            values: {
              TestName: test.title || 'okänd',
              FullTitle: test.fullTitle || test.title,
              Status: test.state || (test.pass ? 'passed' : 'failed'),
              DurationMs: test.duration || 0,
              RunTime: runTime,
              FileName: file,
              SuiteTitle: suite.title || '',
              ErrorMessage: test.err?.message || ''
            }
          };

          console.log(`📤 Skickar: ${payload.values.TestName} (${payload.values.Status})`);
          await sendTestResults(token, payload);
          count++;
        }
      }
    }

    console.log(`✅ Totalt ${count} testresultat skickades till Helix.`);

    // 🧹 Städar upp efter lyckad körning
    if (fs.existsSync(resultsPath)) {
      fs.unlinkSync(resultsPath);
      console.log('🗑️  Tog bort results.json');
    }

    if (fs.existsSync(reportsDir)) {
      fs.readdirSync(reportsDir).forEach(file => {
        if (file.startsWith('mochawesome') && file.endsWith('.json')) {
          const fullPath = path.join(reportsDir, file);
          fs.unlinkSync(fullPath);
          console.log(`🗑️  Tog bort ${file}`);
        }
      });
    }

  } catch (err) {
    console.error('❌ Något gick fel under processen:', err.message);
  }
}

main();
