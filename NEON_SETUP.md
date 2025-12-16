# Neon Database Setup – Notes

For this example, Neon is used as the PostgreSQL provider; however, the role model and privilege configuration described here are standard PostgreSQL concepts and are not Neon-specific.

## Overview

The database is configured with **two PostgreSQL roles**:

- **migrator_user**
  - Owner of the database
  - Used exclusively for migrations and schema changes
  - Has full privileges (DDL + DML)

- **api_user**
  - Used by the application at runtime
  - Restricted to CRUD operations only
  - No schema-altering or ownership privileges

This separation follows least-privilege principles and reduces risk if application credentials are compromised.

---

## Initial Setup Assumptions

- Roles `migrator_user` and `api_user` already exist
- Database name is `npb_prod_db` and `migrator_user` is the owner

---

## In Neon Console SQL Editor

```sql
-- Allow api_user to connect to the database
GRANT CONNECT ON DATABASE npb_prod_db TO api_user;

-- Create schemas (owned by the executing role)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS content;

-- Allow api_user to use the schemas
GRANT USAGE ON SCHEMA public, auth, content TO api_user;

-- Grant CRUD on existing tables
GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public, auth, content
TO api_user;

-- Grant sequence usage (needed for SERIAL / IDENTITY columns)
GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public, auth, content
TO api_user;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO api_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO api_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA content
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO api_user;

-- Default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO api_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT USAGE, SELECT ON SEQUENCES TO api_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA content
GRANT USAGE, SELECT ON SEQUENCES TO api_user;
```
