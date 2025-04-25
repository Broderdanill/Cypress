npm init -y
npm install cypress --save-dev
npx cypress open

# Run a specific test case
npx cypress run --spec "cypress/e2e/test1.cy.js"

# Install support for mssql-db
npm install cypress mssql

# Run Test and send to DB
DB_USER=sa DB_PASS='YourStrong!Passw0rd' DB_SERVER=localhost DB_PORT=1433 DB_NAME=master DB_TABLE=TestResultsFull npm run test:db
