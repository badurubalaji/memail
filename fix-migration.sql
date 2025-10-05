-- Fix failed Flyway migration V8
-- Run this script against your database to repair the migration state

-- 1. Check current migration status
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;

-- 2. Delete the failed V8 migration record (if it exists with success = false)
DELETE FROM flyway_schema_history WHERE version = '8' AND success = false;

-- 3. Verify the fix
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;

-- Now restart your application - V8 will run successfully with the corrected SQL
