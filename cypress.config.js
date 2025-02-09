// cypress.config.js

module.exports = {
  e2e: {
    experimentalRecordApi: true, // Aktivera inspelning av tester
    setupNodeEvents(on, config) {
      // Eventuella andra inställningar eller hooks
    }
  }
}
