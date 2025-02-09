// cypress.config.js

module.exports = {
  e2e: {
    experimentalRecordApi: true, // Aktivera inspelning av tester
    screenshotOnRunFailure: true,
    video: true,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    reportFolder: 'cypress/results',
  },
};
