const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
require('dotenv').config();

// 📦 Hämta miljövariabler
const {
  HELIX_URL,
  HELIX_USER,
  HELIX_PASS,
  HELIX_RECORDING_FORM
} = process.env;

// 🔍 Kontrollera att allt finns
if (!HELIX_URL || !HELIX_USER || !HELIX_PASS || !HELIX_RECORDING_FORM) {
  console.error('❌ Saknade miljövariabler: HELIX_URL, HELIX_USER, HELIX_PASS, HELIX_RECORDING_FORM');
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
    return response.data;
  } catch (err) {
    console.error('❌ Misslyckades logga in till Helix:', err.response?.data || err.message);
    throw err;
  }
}

async function fetchRecordings(token) {
  try {
    const response = await axios.get(`${HELIX_URL}/api/arsys/v1/entry/${HELIX_RECORDING_FORM}`, {
      headers: {
        Authorization: `AR-JWT ${token}`
      }
    });
    return response.data.entries || [];
  } catch (err) {
    console.error('❌ Fel vid hämtning från Helix:', err.response?.data || err.message);
    throw err;
  }
}

async function saveRecordings(entries) {
  const recordingsDir = path.join(__dirname, '../recordings');
  
  // 📂 Skapa katalogen om den inte finns
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  let savedCount = 0;

  for (const entry of entries) {
    const recordingData = entry.values?.Recording; // ⬅️ Fixat här (stor bokstav!)
    const testName = entry.values?.TestName || `recording_${savedCount + 1}`;

    if (recordingData) {
      const fileName = `${testName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      const filePath = path.join(recordingsDir, fileName);
      
      fs.writeFileSync(filePath, JSON.stringify(JSON.parse(recordingData), null, 2), 'utf-8');
      console.log(`✅ Sparade recording till ${fileName}`);
      savedCount++;
    } else {
      console.log(`⚠️  Skippade en rad (ingen "Recording" hittades)`);
    }
  }

  return savedCount;
}

async function main() {
  try {
    const token = await loginHelix();
    const entries = await fetchRecordings(token);

    if (entries.length === 0) {
      console.log('⚠️  Inga inspelningar hittades.');
      return;
    }

    const savedCount = await saveRecordings(entries);
    console.log(`✅ Totalt ${savedCount} recordings sparade.`);

    // 🔥 När klart - kör omvandling till Cypress-testformat
    console.log('🚀 Startar konvertering via convert-all-recordings.js...');
    execSync('node convert-all-recordings.js', { stdio: 'inherit' });
    console.log('✅ Konvertering klar!');

  } catch (err) {
    console.error('❌ Något gick fel:', err.message);
  }
}

main();
