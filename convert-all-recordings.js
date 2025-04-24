const fs = require('fs');
const path = require('path');

const inputDir = './recordings';
const outputDir = './cypress/e2e';
const logPath = './conversion.log';

// 🛠 Skapa output-dir om den inte finns
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 📝 Loggfunktion med tidsstämpel
function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, line);
  console.log(line.trim());
}

// 🎹 Mappa specialtangenter till Cypress-format
function mapKey(key) {
  const specialKeys = {
    Enter: '{enter}',
    Escape: '{esc}',
    Backspace: '{backspace}',
    Tab: '{tab}',
    ArrowUp: '{uparrow}',
    ArrowDown: '{downarrow}',
    ArrowLeft: '{leftarrow}',
    ArrowRight: '{rightarrow}',
    Shift: '{shift}',
    Control: '{ctrl}',
    Alt: '{alt}',
    Meta: '{meta}',
  };
  return specialKeys[key] || key;
}

// 🧩 Hanterare för alla stegtyper
const handlers = {
  setViewport: (step) => {
    if (!step.width || !step.height) throw new Error('setViewport saknar width eller height');
    return `cy.viewport(${step.width}, ${step.height});`;
  },
  navigate: (step) => `cy.visit('${step.url}');`,
  click: (step, selector) => {
    if (step.target && step.target !== step.url) {
      log(`ℹ️ Klick öppnar ny flik – ersätts med cy.visit('${step.target}')`);
      return `cy.visit('${step.target}'); // Öppnade ny flik`;
    }
    return `cy.get('${selector}').click();`;
  },
  doubleClick: (step, selector) => `cy.get('${selector}').dblclick();`,
  change: (step, selector) => `cy.get('${selector}').clear().type('${step.value}');`,
  keyDown: (step, selector) => {
    if (!selector) throw new Error('keyDown saknar selector');
    const key = mapKey(step.key);
    return `cy.get('${selector}').type('${key}');`;
  },
  keyUp: (step, selector) => {
    if (!selector) throw new Error('keyUp saknar selector');
    const key = mapKey(step.key);
    return `// keyUp: ${key} på ${selector} (Cypress hanterar endast .type())`;
  },
  submit: (step, selector) => `cy.get('${selector}').submit();`,
  scroll: (step, selector) =>
    `cy.get('${selector}').scrollTo('${step.scrollPosition?.x || 0}', '${step.scrollPosition?.y || 0}');`,
  hover: (step, selector) => `cy.get('${selector}').trigger('mouseover');`,
  waitForElement: (step, selector) => `cy.get('${selector}').should('exist');`,
  assert: (step, selector) => {
    const assertion = step.assertion || 'exist';
    const value = step.value;
    if (value) {
      return `cy.get('${selector}').should('${assertion}', '${value}');`;
    } else {
      return `cy.get('${selector}').should('${assertion}');`;
    }
  },
};

// 🚀 Kör igenom alla JSON-filer i inputDir
fs.readdirSync(inputDir).forEach(file => {
  if (file.endsWith('.json')) {
    const inputPath = path.join(inputDir, file);
    const baseName = path.parse(file).name;
    const outputPath = path.join(outputDir, `${baseName}.cy.js`);

    try {
      const recording = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
      const steps = recording.steps || [];

      let codeLines = [];
      codeLines.push(`describe('${baseName}', () => {`);
      codeLines.push(`  it('ska återskapa inspelat flöde', () => {`);

      // 🔲 Lägg till viewport om inspelningen innehåller det
      if (recording.viewport && recording.viewport.width && recording.viewport.height) {
        const { width, height } = recording.viewport;
        codeLines.push(`    cy.viewport(${width}, ${height});`);
        log(`ℹ️ [${file}] Viewport satt till ${width}x${height}`);
      }

      steps.forEach((step, index) => {
        const selector = step.selectors?.[0]?.[0];

        if (handlers[step.type]) {
          try {
            const line = handlers[step.type](step, selector);
            codeLines.push(`    ${line}`);
          } catch (err) {
            log(`❌ [${file}] Steg ${index + 1} (${step.type}): ${err.message}`);
            codeLines.push(`    // ⚠️ Fel i ${step.type}: ${err.message}`);
          }
        } else {
          log(`❓ [${file}] Steg ${index + 1}: Ohanterad typ '${step.type}'`);
          codeLines.push(`    // ❓ Ohanterad stegtyp: ${step.type}`);
        }
      });

      codeLines.push(`  });`);
      codeLines.push(`});`);

      fs.writeFileSync(outputPath, codeLines.join('\n'), 'utf-8');
      fs.unlinkSync(inputPath);

      log(`✅ Konverterade och raderade: ${file}`);
    } catch (err) {
      log(`❌ Fel vid konvertering av ${file}: ${err.message}`);
    }
  }
});
