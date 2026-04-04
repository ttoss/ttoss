### Issue Title
Add dedicated READ ONLY environment variables and Lambda for readOnlyQuery

### Issue Body
- Define dedicated read-only environment variables:
  - DATABASE_NAME_READ_ONLY
  - DATABASE_USERNAME_READ_ONLY
  - DATABASE_PASSWORD_READ_ONLY
  - DATABASE_HOST_READ_ONLY
- Create a new lambda (readOnlyQuery) that will use the existing query logic, but reads the above new variables for its configuration.

**Goal:**
This will isolate the configuration for read-only queries, improve security, and make it explicit which connection is used. The new Lambda should only be able to perform read-only operations (SELECTs).