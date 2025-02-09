// cypress.config.js

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Aktivera inspelning av tester (valfritt om du inte använder Cypress Dashboard)
    experimentalRecordApi: false,

    // Aktivera skärmdumpar vid testfel
    screenshotOnRunFailure: true,

    // Aktivera videoinspelning av tester
    video: false,

    // Ange mappar för videor och skärmdumpar
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',

    // Ange mappen för Mochawesome-rapporter
    reportFolder: 'cypress/results',

    // Mochawesome som reporter
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/results',    // Ange var rapporterna ska sparas
      overwrite: false,                // Behåll tidigare resultat
      html: true,                      // Generera en HTML-rapport
      json: true,                      // Generera en JSON-rapport för sammanslagning
    },

    // Om du vill att Cypress ska logga till konsolen:
    watchForFileChanges: true,         // Kan sättas till false för att minska onödiga loggar

    // Fler valfria Cypress-inställningar
    retries: {
      runMode: 2,                      // Försök köra tester 2 gånger vid misslyckande under köra test
      openMode: 1                      // Försök köra tester 1 gång i open mode (för användning vid cypress open)
    }
  }
});
