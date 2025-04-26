npm init -y
npm install cypress --save-dev
npx cypress open

# Run a specific test case
npx cypress run --spec "cypress/e2e/test1.cy.js"

# Install support for mssql-db
npm install cypress mssql

# Run Test and send to DB
DB_USER=sa DB_PASS='YourStrong!Passw0rd' DB_SERVER=localhost DB_PORT=1433 DB_NAME=master DB_TABLE=TestResultsFull npm run test:db

# Run Test and POST to Innovation Studio Record
HELIX_URL='http://localhost:8080' HELIX_USER='Demo' HELIX_PASS='P@ssw0rd' HELIX_FORM='hlx.cypress:TestResults' npm run test:db


# Convert Chrome/Edge recordings to test case
1. Create recording using Chrome
2. Save recording as json file
3. Copy the json file to folder ../recordings/
4. Run script 
    node convert-all-recordings.js