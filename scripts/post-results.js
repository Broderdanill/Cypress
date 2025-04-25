const fs = require('fs');
const sql = require('mssql');
const path = require('path');

// 👇 Ladda miljövariabler från .env om det finns
require('dotenv').config();

const {
  DB_USER,
  DB_PASS,
  DB_SERVER,
  DB_PORT,
  DB_NAME,
  DB_TABLE
} = process.env;

if (!DB_USER || !DB_PASS || !DB_SERVER || !DB_NAME || !DB_TABLE) {
  console.error('❌ En eller flera miljövariabler saknas: DB_USER, DB_PASS, DB_SERVER, DB_PORT, DB_NAME, DB_TABLE');
  process.exit(1);
}

const config = {
  user: DB_USER,
  password: DB_PASS,
  server: DB_SERVER,
  port: parseInt(DB_PORT || '1433', 10),
  database: DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function sendToDb() {
  const resultsPath = path.join(__dirname, '../cypress/results.json');
  const reportsDir = path.join(__dirname, '../cypress/reports');

  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ Filen ${resultsPath} finns inte. Har Cypress körts?`);
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  const runTime = new Date(results.stats?.end || Date.now());

  try {
    const pool = await sql.connect(config);
    let count = 0;

    for (const result of results.results || []) {
      const file = result.file || 'okänd';

      for (const suite of result.suites || []) {
        for (const test of suite.tests || []) {
          const title = test.title || 'okänd';
          const fullTitle = test.fullTitle || title;
          const duration = test.duration || 0;
          const status = test.state || (test.pass ? 'passed' : 'failed');
          const error = test.err?.message || '';

          console.log(`📤 Laddar upp: ${fullTitle} (${status})`);

          const query = `
            INSERT INTO ${DB_TABLE} (
              TestName, FullTitle, State, Pass, Fail, Pending, Skipped,
              TimedOut, IsHook, Speed, DurationMs, RunTime, FileName,
              SuiteTitle, Code, Context, ErrorMessage,
              TestUUID, SuiteUUID, ResultUUID
            ) VALUES (
              @TestName, @FullTitle, @State, @Pass, @Fail, @Pending, @Skipped,
              @TimedOut, @IsHook, @Speed, @DurationMs, @RunTime, @FileName,
              @SuiteTitle, @Code, @Context, @ErrorMessage,
              @TestUUID, @SuiteUUID, @ResultUUID
            )
          `;

          await pool.request()
            .input('TestName', sql.NVarChar, title)
            .input('FullTitle', sql.NVarChar(sql.MAX), fullTitle)
            .input('State', sql.NVarChar, status)
            .input('Pass', sql.Bit, test.pass || false)
            .input('Fail', sql.Bit, test.fail || false)
            .input('Pending', sql.Bit, test.pending || false)
            .input('Skipped', sql.Bit, test.skipped || false)
            .input('TimedOut', sql.Bit, test.timedOut || false)
            .input('IsHook', sql.Bit, test.isHook || false)
            .input('Speed', sql.NVarChar, test.speed || null)
            .input('DurationMs', sql.Int, duration)
            .input('RunTime', sql.DateTime, runTime)
            .input('FileName', sql.NVarChar, file)
            .input('SuiteTitle', sql.NVarChar, suite.title || null)
            .input('Code', sql.NVarChar(sql.MAX), test.code || null)
            .input('Context', sql.NVarChar(sql.MAX), test.context || null)
            .input('ErrorMessage', sql.NVarChar(sql.MAX), error)
            .input('TestUUID', sql.UniqueIdentifier, test.uuid || null)
            .input('SuiteUUID', sql.UniqueIdentifier, suite.uuid || null)
            .input('ResultUUID', sql.UniqueIdentifier, result.uuid || null)
            .query(query);

          count++;
        }
      }
    }

    console.log(`✅ ${count} testresultat laddades upp till tabellen '${DB_TABLE}'.`);
    sql.close();

    // 🧹 Rensa results.json
    if (fs.existsSync(resultsPath)) {
      fs.unlinkSync(resultsPath);
      console.log('🗑️  Tog bort results.json');
    }

    // 🧹 Rensa alla mochawesome*.json
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
    console.error('❌ Fel vid import till databas:', err);
  }
}

sendToDb();
