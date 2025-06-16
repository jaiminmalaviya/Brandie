#!/bin/bash
set -e

# This script will be executed during PostgreSQL container initialization

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create additional databases if needed
    CREATE DATABASE IF NOT EXISTS brandie_test;
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE brandie_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE brandie_test TO postgres;
    
    -- Create extensions if needed
    \c brandie_db;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    \c brandie_test;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    -- Log successful initialization
    \echo 'Database initialization completed successfully!'
EOSQL
