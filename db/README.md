# MSSQL DB in container
This is only a simple msssql-db container to be able to test functionality

# Build container
podman build -t cypress-mssql . 

# Start the container
podman run -d --name cypress-mssql -p 1433:1433 cypress-mssql

# Log in as sa inside Container
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd' -C -N

# Table to recieve test-results
CREATE TABLE TestResultsFull (Id INT IDENTITY(1,1) PRIMARY KEY, TestName NVARCHAR(255), FullTitle NVARCHAR(MAX), State NVARCHAR(50), Pass BIT, Fail BIT, Pending BIT, Skipped BIT, TimedOut BIT, IsHook BIT, Speed NVARCHAR(50), DurationMs INT, RunTime DATETIME, FileName NVARCHAR(255), SuiteTitle NVARCHAR(255), Code NVARCHAR(MAX), Context NVARCHAR(MAX), ErrorMessage NVARCHAR(MAX), TestUUID UNIQUEIDENTIFIER, SuiteUUID UNIQUEIDENTIFIER, ResultUUID UNIQUEIDENTIFIER);
